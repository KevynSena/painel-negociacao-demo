const crypto = require("crypto");
const { config } = require("../config");
const { extractDevedor } = require("../parsers/devedorParser");
const { parseDebtData } = require("../parsers/dadosParser");
const { parseNegotiationOptions } = require("../parsers/negociacaoParser");
const { extractToken } = require("../parsers/tokenParser");
const {
  suggestCounterProposal,
} = require("./riachueloCounterProposalService");
const { postSoap } = require("./soapClient");
const {
  escapeXml,
  formatCurrencyBR,
  normalizeSoapXml,
  onlyDigits,
  takeTag,
  toInt,
  toNumber,
  toSoapDate,
} = require("../utils/xml");

const MANUAL_DISCOUNT_WALLETS = new Set([]);
const API_FIXED_DISCOUNT_WALLETS = new Set(["SUPERDB"]);
const FIXED_MAX_DISCOUNT_WALLETS = new Set(["GMATEUS"]);
const AUTO_CORRECTION_DISCOUNT_WALLETS = new Set(["TOPFAMA"]);
const ZERO_INSTALLMENT_WALLETS = new Set(["SUPERDB"]);
const SUPERDB_DEFAULT_INSTALLMENTS = [1, 3, 6, 12, 17];
const SUPERDB_MAX_INSTALLMENTS = 17;
const SUPERDB_MIN_ENTRY = 50.01;
const SUPERDB_ENTRY_PERCENTAGE = 0.3;
const SUPERDB_MIN_INSTALLMENT_AMOUNT = 50;
const TOPFAMA_ENTRY_PERCENTAGE = 0.3;
const TOPFAMA_MIN_INSTALLMENT_AMOUNT = 50;
const GMATEUS_DEFAULT_INSTALLMENTS = [1, 3, 6, 12, 18, 23];
const GMATEUS_MAX_INSTALLMENTS = 23;
const GMATEUS_ENTRY_PERCENTAGE = 0.3;
const GMATEUS_MIN_INSTALLMENT_AMOUNT = 50;
const GMATEUS_FIXED_DISCOUNT = "100";
const TOKEN_TTL_MS = 55 * 60 * 1000;
const LOOKUP_CONTEXT_TTL_MS = 5 * 60 * 1000;
const NEGOTIATION_BASE_TTL_MS = 5 * 60 * 1000;
const RECALC_RESULT_TTL_MS = 30 * 1000;
const NEGOTIATION_OPTION_TTL_MS = 2 * 60 * 1000;
const GMATEUS_BATCH_SIZE = 2;
const lookupContextCache = new Map();
const negotiationBaseCache = new Map();
const recalculationResultCache = new Map();
const negotiationOptionCache = new Map();
const lookupContextInFlight = new Map();
const negotiationBaseInFlight = new Map();
const recalculationInFlight = new Map();
const negotiationOptionInFlight = new Map();
let tokenCache = {
  value: "",
  expiresAt: 0,
};
let tokenInFlight = null;

function buildEnvelope(action, body) {
  const messageId = `urn:uuid:${crypto.randomUUID()}`;

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/" xmlns:a="http://www.w3.org/2005/08/addressing">
  <soap:Header>
    <a:Action>${escapeXml(action)}</a:Action>
    <a:To>${escapeXml(config.nectarBaseUrl)}</a:To>
    <a:MessageID>${messageId}</a:MessageID>
    <a:ReplyTo>
      <a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address>
    </a:ReplyTo>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
}

function buildLookupCacheKey({ telefone, carteira }) {
  return `${onlyDigits(telefone)}::${String(carteira || "")
    .trim()
    .toUpperCase()}`;
}

function buildNegotiationBaseCacheKey({
  carteira,
  idCon,
  idServ,
  dataPagamento,
  tipoNegociacao,
  valorEntrada,
  tpDesconto,
  descontoManual,
}) {
  return [
    String(carteira || "").trim().toUpperCase(),
    String(idCon || "").trim(),
    String(idServ || "").trim(),
    formatDateForDisplay(dataPagamento),
    String(tipoNegociacao || "").trim(),
    String(valorEntrada || "").trim(),
    String(tpDesconto || "").trim(),
    String(descontoManual || "").trim(),
  ].join("::");
}

function buildRecalculationCacheKey(payload) {
  return [
    onlyDigits(payload.telefone),
    String(payload.carteira || "").trim().toUpperCase(),
    String(payload.idcon || "").trim(),
    String(payload.tipoNegociacao || "").trim(),
    formatDateForDisplay(payload.dataPagamento),
    String(payload.descontoManual || "").trim(),
    String(payload.valorEntrada || "").trim(),
    String(payload.parcelaPersonalizada || "").trim(),
  ].join("::");
}

function buildNegotiationOptionCacheKey({
  carteira,
  idCon,
  idServ,
  dataPagamento,
  parcelasNum,
  tpDesconto,
  descontoPrincipal,
  descontoCorrecao,
  valorEntrada,
  valordemais,
  valorTotalSugerido,
  valorParcelaSugerido,
  dtSegundaParcela,
}) {
  return [
    String(carteira || "").trim().toUpperCase(),
    String(idCon || "").trim(),
    String(idServ || "").trim(),
    formatDateForDisplay(dataPagamento),
    String(parcelasNum ?? "").trim(),
    String(tpDesconto || "").trim(),
    String(descontoPrincipal || "").trim(),
    String(descontoCorrecao || "").trim(),
    String(valorEntrada || "").trim(),
    String(valordemais || "").trim(),
    String(valorTotalSugerido || "").trim(),
    String(valorParcelaSugerido || "").trim(),
    String(dtSegundaParcela || "").trim(),
  ].join("::");
}

function getWalletCustomInstallmentLimit(carteira) {
  const normalized = String(carteira || "").trim().toUpperCase();
  if (normalized === "GMATEUS") {
    return GMATEUS_MAX_INSTALLMENTS;
  }
  return SUPERDB_MAX_INSTALLMENTS;
}

function getCachedToken() {
  if (!tokenCache.value || tokenCache.expiresAt <= Date.now()) {
    return null;
  }

  return tokenCache.value;
}

function setCachedToken(token) {
  tokenCache = {
    value: String(token || "").trim(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
}

function getLookupContextFromCache(payload) {
  const key = buildLookupCacheKey(payload);
  const entry = lookupContextCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    lookupContextCache.delete(key);
    return null;
  }

  return entry.value;
}

function setLookupContextCache(payload, value) {
  lookupContextCache.set(buildLookupCacheKey(payload), {
    expiresAt: Date.now() + LOOKUP_CONTEXT_TTL_MS,
    value,
  });
}

function getNegotiationBaseFromCache(payload) {
  const key = buildNegotiationBaseCacheKey(payload);
  const entry = negotiationBaseCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    negotiationBaseCache.delete(key);
    return null;
  }

  return entry.value;
}

function setNegotiationBaseCache(payload, value) {
  negotiationBaseCache.set(buildNegotiationBaseCacheKey(payload), {
    expiresAt: Date.now() + NEGOTIATION_BASE_TTL_MS,
    value,
  });
}

function getRecalculationResultFromCache(payload) {
  const key = buildRecalculationCacheKey(payload);
  const entry = recalculationResultCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    recalculationResultCache.delete(key);
    return null;
  }

  return entry.value;
}

function setRecalculationResultCache(payload, value) {
  recalculationResultCache.set(buildRecalculationCacheKey(payload), {
    expiresAt: Date.now() + RECALC_RESULT_TTL_MS,
    value,
  });
}

function getNegotiationOptionFromCache(payload) {
  const key = buildNegotiationOptionCacheKey(payload);
  const entry = negotiationOptionCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    negotiationOptionCache.delete(key);
    return null;
  }

  return entry.value;
}

function setNegotiationOptionCache(payload, value) {
  negotiationOptionCache.set(buildNegotiationOptionCacheKey(payload), {
    expiresAt: Date.now() + NEGOTIATION_OPTION_TTL_MS,
    value,
  });
}

function buildDebtContext({ token, devedor, dividaXml, idcon }) {
  const dados = parseDebtData(dividaXml, idcon);

  if (!dados.NomeCliente && devedor.nome) {
    dados.NomeCliente = devedor.nome;
    dados.PrimeiroNome = devedor.PrimeiroNome;
  }

  const noContracts =
    !String(dados.IdCon || "").trim() &&
    (!Array.isArray(dados.ContratosIdcon) || dados.ContratosIdcon.length === 0);
  const detailMessage = String(
    dados.MensagemAdicional || dados.Mensagem || ""
  ).trim();

  if (noContracts && detailMessage) {
    const error = new Error(
      `O Nectar localizou o cliente, mas não retornou contrato válido para cálculo. ${detailMessage}`
    );
    error.statusCode = 422;
    throw error;
  }

  return {
    token,
    devedor,
    dados,
  };
}

async function getToken() {
  const cachedToken = getCachedToken();
  if (cachedToken) {
    return cachedToken;
  }

  if (tokenInFlight) {
    return tokenInFlight;
  }

  tokenInFlight = (async () => {
    const action = "http://tempuri.org/IServicoNectar/GetToken";
    const body = `<tem:GetToken>
      <tem:cnpj>${escapeXml(config.nectarCnpj)}</tem:cnpj>
      <tem:codigoParceiro>${escapeXml(config.nectarCodigoParceiro)}</tem:codigoParceiro>
      <tem:usu>${escapeXml(config.nectarUsuario)}</tem:usu>
      <tem:pass>${escapeXml(config.nectarSenha)}</tem:pass>
    </tem:GetToken>`;

    const xml = await postSoap(action, buildEnvelope(action, body));
    const token = extractToken(xml);
    setCachedToken(token);
    return token;
  })();

  try {
    return await tokenInFlight;
  } finally {
    tokenInFlight = null;
  }
}

async function loadLookupSnapshot({ telefone, carteira }) {
  const payload = { telefone, carteira };
  const cachedContext = getLookupContextFromCache(payload);
  if (cachedContext) {
    return cachedContext;
  }

  const cacheKey = buildLookupCacheKey(payload);
  if (lookupContextInFlight.has(cacheKey)) {
    return lookupContextInFlight.get(cacheKey);
  }

  const promise = (async () => {
    const token = await getToken();
    const devedorXml = await getDadosDevedor({ telefone, carteira, token });
    const devedor = extractDevedor(devedorXml);

    if (!devedor.cpfEncontrado) {
      const error = new Error(
        "Não foi possível localizar o CPF do cliente pelo telefone informado."
      );
      error.statusCode = 404;
      throw error;
    }

    const dividaXml = await getDadosDivida({
      cpf: devedor.cpf,
      carteira,
      token,
    });

    const value = {
      devedor,
      dividaXml,
    };

    setLookupContextCache(payload, value);
    return value;
  })();

  lookupContextInFlight.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    lookupContextInFlight.delete(cacheKey);
  }
}

async function getDadosDevedor({ telefone, carteira, token }) {
  const action = "http://tempuri.org/IServicoNectar/GetDadosDevedor";
  const body = `<tem:GetDadosDevedor>
      <tem:tels>1</tem:tels>
      <tem:ends>0</tem:ends>
      <tem:emails>0</tem:emails>
      <tem:dddTelefone>${escapeXml(onlyDigits(telefone))}</tem:dddTelefone>
      <tem:TelDivida>0</tem:TelDivida>
      <tem:agrupamento>${escapeXml(String(carteira || "").trim().toUpperCase())}</tem:agrupamento>
      <tem:codigoParceiro>${escapeXml(config.nectarCodigoParceiro)}</tem:codigoParceiro>
      <tem:codigoToken>${escapeXml(token)}</tem:codigoToken>
    </tem:GetDadosDevedor>`;

  return postSoap(action, buildEnvelope(action, body));
}

async function getDadosDivida({ cpf, carteira, token }) {
  const action = "http://tempuri.org/IServicoNectar/GetDadosDivida";
  const body = `<tem:GetDadosDivida>
      <tem:cnpjcpf>${escapeXml(onlyDigits(cpf))}</tem:cnpjcpf>
      <tem:agrupamento>${escapeXml(String(carteira || "").trim().toUpperCase())}</tem:agrupamento>
      <tem:atualizarDivida>1</tem:atualizarDivida>
      <tem:codigoParceiro>${escapeXml(config.nectarCodigoParceiro)}</tem:codigoParceiro>
      <tem:codigoToken>${escapeXml(token)}</tem:codigoToken>
      <tem:idPesReal></tem:idPesReal>
      <tem:origemReal></tem:origemReal>
    </tem:GetDadosDivida>`;

  return postSoap(action, buildEnvelope(action, body));
}

async function getOpcoesNegociacao({
  token,
  idCon,
  idServ,
  carteira,
  dataPagamento,
  descontoManual,
  descontoPrincipal,
  descontoCorrecao,
  valorEntrada,
  tpDesconto,
  parcelasNum,
  valordemais,
  valorTotalSugerido,
  valorParcelaSugerido,
  dtSegundaParcela,
}) {
  const action = "http://tempuri.org/IServicoNectar/GetOpcoesNegociacao";
  const normalizedWallet = String(carteira || "").trim().toUpperCase();
  const tpDescontoFinal =
    tpDesconto ||
    (MANUAL_DISCOUNT_WALLETS.has(normalizedWallet) ? "2" : "1");
  const parcelasNumFinal =
    parcelasNum ??
    (ZERO_INSTALLMENT_WALLETS.has(normalizedWallet) ? "0" : "");
  const vencimento =
    normalizedWallet === "SUPERDB" && !dataPagamento
      ? toSoapDate(new Date())
      : toSoapDate(dataPagamento);
  const descontoPrincipalNormalizado = String(
    descontoPrincipal ?? descontoManual ?? ""
  ).trim();
  const descontoCorrecaoNormalizado = String(descontoCorrecao || "").trim();
  const valorEntradaNormalizado = String(valorEntrada || "").trim();
  const valorDemaisNormalizado = String(valordemais || "").trim();
  const valorTotalSugeridoNormalizado = String(valorTotalSugerido || "").trim();
  const valorParcelaSugeridoNormalizado = String(
    valorParcelaSugerido || ""
  ).trim();
  const dtSegundaParcelaNormalizada = String(dtSegundaParcela || "").trim();
  const cachePayload = {
    carteira: normalizedWallet,
    idCon,
    idServ,
    dataPagamento: vencimento,
    parcelasNum: parcelasNumFinal,
    tpDesconto: tpDescontoFinal,
    descontoPrincipal: descontoPrincipalNormalizado,
    descontoCorrecao: descontoCorrecaoNormalizado,
    valorEntrada: valorEntradaNormalizado,
    valordemais: valorDemaisNormalizado,
    valorTotalSugerido: valorTotalSugeridoNormalizado,
    valorParcelaSugerido: valorParcelaSugeridoNormalizado,
    dtSegundaParcela: dtSegundaParcelaNormalizada,
  };
  const cachedOption = getNegotiationOptionFromCache(cachePayload);
  if (cachedOption) {
    return cachedOption;
  }

  const cacheKey = buildNegotiationOptionCacheKey(cachePayload);
  if (negotiationOptionInFlight.has(cacheKey)) {
    return negotiationOptionInFlight.get(cacheKey);
  }
  const body = `<tem:GetOpcoesNegociacao>
      <tem:idCon>${escapeXml(String(idCon || ""))}</tem:idCon>
      <tem:idServ>${escapeXml(String(idServ || ""))}</tem:idServ>
      <tem:titulos></tem:titulos>
      <tem:parcelasNum>${escapeXml(String(parcelasNumFinal))}</tem:parcelasNum>
      <tem:vencPrimParcela>${escapeXml(vencimento)}</tem:vencPrimParcela>
      <tem:tiponegociacao>3</tem:tiponegociacao>
      <tem:tpDesconto>${escapeXml(tpDescontoFinal)}</tem:tpDesconto>
      <tem:percDescAplicNoPrincipal>${escapeXml(
        descontoPrincipalNormalizado
      )}</tem:percDescAplicNoPrincipal>
      <tem:percDescAplicNaCorrecao>${escapeXml(
        descontoCorrecaoNormalizado
      )}</tem:percDescAplicNaCorrecao>
      <tem:percDescAplicNosHonorarios></tem:percDescAplicNosHonorarios>
      <tem:percDescAplicNaPontualidade></tem:percDescAplicNaPontualidade>
      <tem:percDescAplicNaMulta></tem:percDescAplicNaMulta>
      <tem:percDescAplicNoJuros></tem:percDescAplicNoJuros>
      <tem:valorAplicNoJuros></tem:valorAplicNoJuros>
      <tem:valorEntradaSugerido>${escapeXml(
        valorEntradaNormalizado
      )}</tem:valorEntradaSugerido>
      <tem:valordemais>${escapeXml(valorDemaisNormalizado)}</tem:valordemais>
      <tem:valorTotalSugerido>${escapeXml(
        valorTotalSugeridoNormalizado
      )}</tem:valorTotalSugerido>
      <tem:valorParcelaSugerido>${escapeXml(
        valorParcelaSugeridoNormalizado
      )}</tem:valorParcelaSugerido>
      <tem:codigoParceiro>${escapeXml(config.nectarCodigoParceiro)}</tem:codigoParceiro>
      <tem:codigoToken>${escapeXml(token)}</tem:codigoToken>
      <tem:dtSegundaParcela>${escapeXml(
        dtSegundaParcelaNormalizada
      )}</tem:dtSegundaParcela>
      <tem:percDescAplicNaAntecipacao></tem:percDescAplicNaAntecipacao>
      <tem:condicaoEnquadramento></tem:condicaoEnquadramento>
      <tem:idPesReal></tem:idPesReal>
      <tem:origemReal></tem:origemReal>
      <tem:tipoNegociacaoDetalhe></tem:tipoNegociacaoDetalhe>
      <tem:especiePagamento></tem:especiePagamento>
    </tem:GetOpcoesNegociacao>`;

  const promise = postSoap(action, buildEnvelope(action, body));
  negotiationOptionInFlight.set(cacheKey, promise);

  try {
    const xml = await promise;
    setNegotiationOptionCache(cachePayload, xml);
    return xml;
  } finally {
    negotiationOptionInFlight.delete(cacheKey);
  }
}

function formatNumberForSoap(value) {
  if (value == null || value === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return parsed.toFixed(2);
}

function formatPercentForSoap(value) {
  if (value == null || value === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(roundMoney(parsed));
}

function extractNegotiationBlocks(xml) {
  const normalized = normalizeSoapXml(xml);
  return Array.from(
    normalized.matchAll(/<OpcoesNegociacao[^>]*>[\s\S]*?<\/OpcoesNegociacao>/gi)
  ).map((match) => match[0]);
}

function mergeNegotiationResponses(xmlList) {
  const blocks = xmlList.flatMap(extractNegotiationBlocks);
  return blocks.length > 0 ? `<Resultado>${blocks.join("")}</Resultado>` : "";
}

function getManualOptionSeeds(negociacao) {
  return Object.entries(negociacao.payload_by_id || {})
    .sort(([leftKey], [rightKey]) => {
      const leftOrder = Number(String(leftKey).replace(/\D/g, "")) || 0;
      const rightOrder = Number(String(rightKey).replace(/\D/g, "")) || 0;
      return leftOrder - rightOrder;
    })
    .map(([, option]) => option)
    .filter((option) => option && option.total != null);
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeInstallmentCount(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function formatDateForDisplay(value) {
  const soapDate = toSoapDate(value);
  return soapDate || toSoapDate(new Date());
}

function addOneMonthKeepingDay(value) {
  const base = String(value || "").trim();
  const [day, month, year] = formatDateForDisplay(base)
    .split("/")
    .map((part) => Number(part));

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastDay = new Date(nextYear, nextMonth, 0).getDate();
  const safeDay = Math.min(day, lastDay);

  return [
    String(safeDay).padStart(2, "0"),
    String(nextMonth).padStart(2, "0"),
    String(nextYear),
  ].join("/");
}

function getSuperDbInstallmentCounts(customInstallment, tipoNegociacao) {
  const counts =
    Number(tipoNegociacao || 1) === 2
      ? [1]
      : SUPERDB_DEFAULT_INSTALLMENTS.slice();

  const parsedCustom = normalizeInstallmentCount(customInstallment);
  if (
    parsedCustom &&
    parsedCustom >= 2 &&
    parsedCustom <= SUPERDB_MAX_INSTALLMENTS &&
    !counts.includes(parsedCustom)
  ) {
    counts.push(parsedCustom);
  }

  return counts;
}

function getGmateusInstallmentCounts(customInstallment, tipoNegociacao) {
  const counts =
    Number(tipoNegociacao || 1) === 2
      ? [1]
      : GMATEUS_DEFAULT_INSTALLMENTS.slice();

  const parsedCustom = normalizeInstallmentCount(customInstallment);
  if (
    parsedCustom &&
    parsedCustom >= 2 &&
    parsedCustom <= GMATEUS_MAX_INSTALLMENTS &&
    !counts.includes(parsedCustom)
  ) {
    counts.push(parsedCustom);
  }

  return counts;
}

function buildSuperDbPlan(total, parcelas, requestedEntry = null) {
  if (parcelas <= 1) {
    return {
      parcelas: 1,
      entrada: roundMoney(total),
      parcela: 0,
      total: roundMoney(total),
    };
  }

  const restantes = parcelas - 1;
  const entradaSolicitada = toNumber(requestedEntry);
  let valorEntrada = roundMoney(
    entradaSolicitada >= SUPERDB_MIN_ENTRY
      ? entradaSolicitada
      : Math.max(total * SUPERDB_ENTRY_PERCENTAGE, SUPERDB_MIN_ENTRY)
  );

  if (valorEntrada >= total) {
    return null;
  }

  let valorParcela = Math.floor(((total - valorEntrada) / restantes) * 100) / 100;
  valorParcela = roundMoney(Math.max(0, valorParcela));
  valorEntrada = roundMoney(total - valorParcela * restantes);

  if (valorParcela < SUPERDB_MIN_INSTALLMENT_AMOUNT) {
    return null;
  }

  return {
    parcelas,
    entrada: valorEntrada,
    parcela: valorParcela,
    total: roundMoney(total),
  };
}

function extractNegotiationTotal(xml) {
  const normalized = normalizeSoapXml(xml);
  return roundMoney(
    toNumber(takeTag("ValorTotalAcordo", normalized)) ||
      toNumber(takeTag("ValorCorrigido", normalized)) ||
      toNumber(takeTag("ValorPrimeira", normalized))
  );
}

function extractMaxCorrectionDiscount(xml) {
  return roundMoney(
    toNumber(takeTag("PercentualMaximoDeDescontoNaCorrecao", normalizeSoapXml(xml)))
  );
}

function extractGmateusMinimumEntry(xml) {
  const normalized = normalizeSoapXml(xml)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const matches = Array.from(
    normalized.matchAll(
      /entrada[^R$]{0,120}?permitido[^R$]{0,40}?R\$\s*([0-9.,]+)/gi
    )
  )
    .map((match) => roundMoney(toNumber(match[1])))
    .filter((value) => value > 0);

  if (matches.length === 0) {
    return 0;
  }

  return roundMoney(Math.max(...matches));
}

function hasNegotiationOptions(xml) {
  return extractNegotiationBlocks(xml).length > 0;
}

async function runInBatches(items, batchSize, runner) {
  const output = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((item) => runner(item)));
    output.push(...results);
  }

  return output;
}

async function requestGmateusInstallmentOption({
  token,
  idCon,
  idServ,
  carteira,
  dataPagamento,
  dtSegundaParcela,
  parcelas,
  totalAvista,
  requestedEntry,
  resolveMinimumEntry,
}) {
  if (parcelas <= 1 || requestedEntry >= totalAvista) {
    return {
      parcelas,
      xml: "",
      entryUsed: requestedEntry,
      apiMinimumEntry: 0,
      retriedWithMinimum: false,
      skipped: true,
    };
  }

  const requestOption = async (entryValue) =>
    getOpcoesNegociacao({
      token,
      idCon,
      idServ,
      carteira,
      dataPagamento,
      descontoPrincipal: "",
      descontoCorrecao: GMATEUS_FIXED_DISCOUNT,
      valorEntrada: formatNumberForSoap(entryValue),
      tpDesconto: "2",
      parcelasNum: String(parcelas),
      dtSegundaParcela,
    });

  let firstXml = "";
  try {
    firstXml = await requestOption(requestedEntry);
  } catch (error) {
    return {
      parcelas,
      xml: "",
      entryUsed: requestedEntry,
      apiMinimumEntry: 0,
      retriedWithMinimum: false,
      skipped: false,
      errorMessage: error.message || "Erro ao consultar a parcela.",
    };
  }
  if (hasNegotiationOptions(firstXml)) {
    return {
      parcelas,
      xml: firstXml,
      entryUsed: requestedEntry,
      apiMinimumEntry: 0,
      retriedWithMinimum: false,
      skipped: false,
    };
  }

  let minimumEntry = extractGmateusMinimumEntry(firstXml);
  if (!minimumEntry && typeof resolveMinimumEntry === "function") {
    try {
      minimumEntry = roundMoney(await resolveMinimumEntry());
    } catch (_error) {
      minimumEntry = 0;
    }
  }
  if (minimumEntry > requestedEntry && minimumEntry < totalAvista) {
    try {
      const retryXml = await requestOption(minimumEntry);
      if (hasNegotiationOptions(retryXml)) {
        return {
          parcelas,
          xml: retryXml,
          entryUsed: minimumEntry,
          apiMinimumEntry: minimumEntry,
          retriedWithMinimum: true,
          skipped: false,
        };
      }
    } catch (error) {
      return {
        parcelas,
        xml: "",
        entryUsed: minimumEntry,
        apiMinimumEntry: minimumEntry,
        retriedWithMinimum: true,
        skipped: false,
        errorMessage: error.message || "Erro ao recalcular a parcela.",
      };
    }
  }

  return {
    parcelas,
    xml: "",
    entryUsed: minimumEntry > 0 ? minimumEntry : requestedEntry,
    apiMinimumEntry: minimumEntry,
    retriedWithMinimum: minimumEntry > requestedEntry,
    skipped: false,
    errorMessage: "",
  };
}

async function loadGmateusNegotiation({
  token,
  idCon,
  idServ,
  carteira,
  dataPagamento,
  tipoNegociacao,
  dtSegundaParcela,
  valorEntrada,
  customInstallment,
}) {
  let minimumEntryHint = 0;
  let minimumEntryPromise = null;
  const resolveMinimumEntry = async () => {
    if (minimumEntryHint > 0) {
      return minimumEntryHint;
    }

    if (!minimumEntryPromise) {
      minimumEntryPromise = (async () => {
        const probeXml = await getOpcoesNegociacao({
          token,
          idCon,
          idServ,
          carteira,
          dataPagamento,
          descontoPrincipal: "",
          descontoCorrecao: GMATEUS_FIXED_DISCOUNT,
          valorEntrada: "",
          tpDesconto: "2",
          parcelasNum: "",
          dtSegundaParcela,
        });
        minimumEntryHint = extractGmateusMinimumEntry(probeXml);
        return minimumEntryHint;
      })();
    }

    return minimumEntryPromise;
  };
  const avistaXml = await getOpcoesNegociacao({
    token,
    idCon,
    idServ,
    carteira,
    dataPagamento,
    descontoPrincipal: "",
    descontoCorrecao: GMATEUS_FIXED_DISCOUNT,
    valorEntrada: "",
    tpDesconto: "2",
    parcelasNum: "1",
    dtSegundaParcela,
  });
  const totalAvista = extractNegotiationTotal(avistaXml);
  const entradaDigitada = roundMoney(toNumber(valorEntrada));
  const entradaBase = roundMoney(
    entradaDigitada > 0 ? entradaDigitada : totalAvista * GMATEUS_ENTRY_PERCENTAGE
  );
  const parcelasCalculadas = getGmateusInstallmentCounts(
    customInstallment,
    tipoNegociacao
  );
  const parcelasParceladas = parcelasCalculadas.filter((parcelas) => parcelas > 1);
  const resultadosParcelados = await runInBatches(
    parcelasParceladas,
    GMATEUS_BATCH_SIZE,
    (parcelas) =>
      requestGmateusInstallmentOption({
        token,
        idCon,
        idServ,
        carteira,
        dataPagamento,
        dtSegundaParcela,
        parcelas,
        totalAvista,
        requestedEntry: entradaBase,
        resolveMinimumEntry,
      })
  );
  const parcelasSemRetorno = resultadosParcelados.filter(
    (item) => !item.xml && !item.skipped
  );

  if (parcelasSemRetorno.length > 0) {
    const retried = await runInBatches(parcelasSemRetorno, 1, (item) =>
      requestGmateusInstallmentOption({
        token,
        idCon,
        idServ,
        carteira,
        dataPagamento,
        dtSegundaParcela,
        parcelas: item.parcelas,
        totalAvista,
        requestedEntry: item.entryUsed || entradaBase,
        resolveMinimumEntry,
      })
    );

    for (const retryItem of retried) {
      const currentIndex = resultadosParcelados.findIndex(
        (item) => item.parcelas === retryItem.parcelas
      );
      if (currentIndex >= 0) {
        resultadosParcelados[currentIndex] = retryItem;
      }
    }
  }
  const opcoesXml =
    mergeNegotiationResponses([
      avistaXml,
      ...resultadosParcelados
        .filter((item) => item.xml)
        .map((item) => item.xml),
    ]) || avistaXml;

  return {
    opcoesXml,
    avistaXml,
    totalAvista,
    entradaBase,
    parcelasCalculadas,
    resultadosParcelados,
  };
}

async function loadTopfamaNegotiation({
  token,
  idCon,
  idServ,
  carteira,
  dataPagamento,
  dtSegundaParcela,
  valorEntrada,
}) {
  const baseOpcoesXml = await getOpcoesNegociacao({
    token,
    idCon,
    idServ,
    carteira,
    dataPagamento,
    descontoPrincipal: "",
    descontoCorrecao: "",
    valorEntrada: "",
    tpDesconto: "2",
    parcelasNum: "",
    dtSegundaParcela,
  });
  const maxCorrectionDiscount = extractMaxCorrectionDiscount(baseOpcoesXml);
  const previewOpcoesXml =
    maxCorrectionDiscount > 0
      ? await getOpcoesNegociacao({
          token,
          idCon,
          idServ,
          carteira,
          dataPagamento,
          descontoPrincipal: "",
          descontoCorrecao: formatPercentForSoap(maxCorrectionDiscount),
          valorEntrada: "",
          tpDesconto: "2",
          parcelasNum: "",
          dtSegundaParcela,
        })
      : baseOpcoesXml;
  const valorAvista = extractNegotiationTotal(previewOpcoesXml);
  const entradaDigitada = roundMoney(toNumber(valorEntrada));
  const entradaAplicada = roundMoney(
    entradaDigitada > 0 ? entradaDigitada : valorAvista * TOPFAMA_ENTRY_PERCENTAGE
  );
  const opcoesXml =
    maxCorrectionDiscount > 0 && entradaAplicada > 0
      ? await getOpcoesNegociacao({
          token,
          idCon,
          idServ,
          carteira,
          dataPagamento,
          descontoPrincipal: "",
          descontoCorrecao: formatPercentForSoap(maxCorrectionDiscount),
          valorEntrada: formatNumberForSoap(entradaAplicada),
          tpDesconto: "2",
          parcelasNum: "",
          dtSegundaParcela,
        })
      : previewOpcoesXml;
  const mergedOpcoesXml =
    mergeNegotiationResponses([previewOpcoesXml, opcoesXml]) || opcoesXml;

  return {
    baseOpcoesXml,
    previewOpcoesXml,
    opcoesXml: mergedOpcoesXml,
    maxCorrectionDiscount,
    valorAvista,
    entradaAplicada,
  };
}

function extractAvailableDiscounts(xml) {
  const normalized = normalizeSoapXml(xml);
  const principal = toNumber(takeTag("ValorDescontoNoPrincipal", normalized));
  const correcao = toNumber(takeTag("ValorDescontoNaCorrecao", normalized));
  const juros = toNumber(takeTag("ValorDescontoNoJuros", normalized));
  const multa = toNumber(takeTag("ValorDescontoNaMulta", normalized));
  const honorarios = toNumber(takeTag("ValorDescontoNosHonorarios", normalized));

  return {
    principal,
    correcao,
    juros,
    multa,
    honorarios,
    total: roundMoney(principal + correcao + juros + multa + honorarios),
  };
}

function buildSuperDbNegotiation(baseNegotiation, discounts, context = {}) {
  const firstOption = getManualOptionSeeds(baseNegotiation)[0];
  if (!firstOption) {
    return baseNegotiation;
  }

  const header =
    baseNegotiation.mensagens_zap_por_opcao?.find(
      (item) => item.id === "opt_header_recalc"
    )?.texto || "Selecionei as melhores opções de pagamento:";
  const cta =
    baseNegotiation.mensagens_zap_por_opcao?.find((item) => item.id === "opt_cta")
      ?.texto || "Podemos formalizar qual opção de pagamento?";
  const totalComDesconto = roundMoney(
    Math.max(0, Number(firstOption.total || 0) - Number(discounts.total || 0))
  );
  const parcelasCalculadas = getSuperDbInstallmentCounts(
    context.customInstallment,
    context.tipoNegociacao
  );
  const dataPrimeiraParcela = formatDateForDisplay(
    context.dataPagamento || firstOption.dataEntrada
  );
  const dataDemaisParcelas = addOneMonthKeepingDay(dataPrimeiraParcela);
  const opcoes = parcelasCalculadas
    .map((parcelas) => {
      const plano = buildSuperDbPlan(
        totalComDesconto,
        parcelas,
        context.valorEntrada
      );
      if (!plano) {
        return null;
      }

      const restantes = Math.max(0, parcelas - 1);
      const label =
        parcelas === 1
          ? `À vista por ${formatCurrencyBR(plano.total)}`
          : `Entrada de ${formatCurrencyBR(plano.entrada)} + ${restantes}x de ${formatCurrencyBR(plano.parcela)}`;

      return {
        label,
        payload: {
          ...firstOption,
          parcelas,
          entrada: plano.entrada,
          parcela: plano.parcela,
          total: plano.total,
          dataEntrada: dataPrimeiraParcela,
          dataPrimeiraParcela,
          dataDemaisParcelas,
          diaDemaisParcelas: dataDemaisParcelas.slice(0, 2),
          descontoAplicadoPrincipal: discounts.principal,
          descontoAplicadoCorrecao: discounts.correcao,
          descontoAplicadoJuros: discounts.juros,
          descontoAplicadoMulta: discounts.multa,
          descontoAplicadoHonorarios: discounts.honorarios,
          descontoAplicadoTotal: discounts.total,
        },
      };
    })
    .filter(Boolean)
    .map((option, index) => {
      const linha = `${index + 1}) ${option.label}`;

      return {
        id: `opt_${index + 1}`,
        label: option.label,
        linha,
        payload: option.payload,
      };
    });

  return {
    ...baseNegotiation,
    totalOpcoes: opcoes.length,
    opcoes_zap: opcoes.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    mensagem_zap: opcoes.map((option) => option.linha).join("\n"),
    mensagens_zap: opcoes.map((option) => option.linha),
    mensagens_zap_por_opcao: [
      { id: "opt_header_recalc", numero: null, texto: header },
      ...opcoes.map((option, index) => ({
        id: option.id,
        numero: index + 1,
        texto: option.linha,
      })),
      { id: "opt_cta", numero: null, texto: cta },
    ],
    mensagem_zap_unica: [
      header,
      "",
      ...opcoes.flatMap((option) => [option.linha, ""]),
      cta,
    ]
      .join("\n")
      .trim(),
    payload_by_id: opcoes.reduce((accumulator, option) => {
      accumulator[option.id] = option.payload;
      return accumulator;
    }, {}),
    linhas_texto: [
      "Encontrei estas opções de negociação:",
      ...opcoes.map((option) => option.linha),
      "Responda com o número da opção desejada.",
    ],
    opcoes_compact: opcoes.map((option) => option.linha).join(" | "),
    debug: {
      ...(baseNegotiation.debug || {}),
      fluxoDescontoApi: {
        tipo: "fixo",
        valorPrincipal: discounts.principal,
        valorCorrecao: discounts.correcao,
        valorJuros: discounts.juros,
        valorMulta: discounts.multa,
        valorHonorarios: discounts.honorarios,
        valorTotalDesconto: discounts.total,
        valorFinal: totalComDesconto,
        parcelasCalculadas,
        dataPrimeiraParcela,
        dataDemaisParcelas,
      },
    },
  };
}

function buildGmateusNegotiation(baseNegotiation, context = {}) {
  const firstOption = getManualOptionSeeds(baseNegotiation)[0];
  if (!firstOption) {
    return baseNegotiation;
  }

  const header =
    baseNegotiation.mensagens_zap_por_opcao?.find(
      (item) => item.id === "opt_header_recalc"
    )?.texto || "Selecionei as melhores opções de pagamento:";
  const cta =
    baseNegotiation.mensagens_zap_por_opcao?.find((item) => item.id === "opt_cta")
      ?.texto || "Podemos formalizar qual opção de pagamento?";
  const totalComDesconto = roundMoney(Number(firstOption.total || 0));
  const entradaMinimaApi = roundMoney(
    context.apiMinimumEntry || getApiMinimumEntry(baseNegotiation)
  );
  const parcelasCalculadas = getGmateusInstallmentCounts(
    context.customInstallment,
    context.tipoNegociacao
  );
  const dataPrimeiraParcela = formatDateForDisplay(
    context.dataPagamento || firstOption.dataEntrada
  );
  const dataDemaisParcelas = addOneMonthKeepingDay(dataPrimeiraParcela);
  const opcoes = parcelasCalculadas
    .map((parcelas) => {
      const plano = buildGmateusPlan(
        totalComDesconto,
        parcelas,
        context.valorEntrada,
        entradaMinimaApi
      );
      if (!plano) {
        return null;
      }

      const restantes = Math.max(0, parcelas - 1);
      const label =
        parcelas === 1
          ? `À vista por ${formatCurrencyBR(plano.total)}`
          : `Entrada de ${formatCurrencyBR(plano.entrada)} + ${restantes}x de ${formatCurrencyBR(plano.parcela)}`;

      return {
        label,
        payload: {
          ...firstOption,
          parcelas,
          entrada: plano.entrada,
          parcela: plano.parcela,
          total: plano.total,
          dataEntrada: dataPrimeiraParcela,
          dataPrimeiraParcela,
          dataDemaisParcelas,
          diaDemaisParcelas: dataDemaisParcelas.slice(0, 2),
          descontoAplicadoPrincipalPercentual: Number(GMATEUS_FIXED_DISCOUNT),
          descontoAplicadoTotal: null,
          entradaMinimaApi,
        },
      };
    })
    .filter(Boolean)
    .map((option, index) => {
      const linha = `${index + 1}) ${option.label}`;

      return {
        id: `opt_${index + 1}`,
        label: option.label,
        linha,
        payload: option.payload,
      };
    });

  return {
    ...baseNegotiation,
    totalOpcoes: opcoes.length,
    opcoes_zap: opcoes.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    mensagem_zap: opcoes.map((option) => option.linha).join("\n"),
    mensagens_zap: opcoes.map((option) => option.linha),
    mensagens_zap_por_opcao: [
      { id: "opt_header_recalc", numero: null, texto: header },
      ...opcoes.map((option, index) => ({
        id: option.id,
        numero: index + 1,
        texto: option.linha,
      })),
      { id: "opt_cta", numero: null, texto: cta },
    ],
    mensagem_zap_unica: [
      header,
      "",
      ...opcoes.flatMap((option) => [option.linha, ""]),
      cta,
    ]
      .join("\n")
      .trim(),
    payload_by_id: opcoes.reduce((accumulator, option) => {
      accumulator[option.id] = option.payload;
      return accumulator;
    }, {}),
    linhas_texto: [
      "Encontrei estas opções de negociação:",
      ...opcoes.map((option) => option.linha),
      "Responda com o número da opção desejada.",
    ],
    opcoes_compact: opcoes.map((option) => option.linha).join(" | "),
    debug: {
      ...(baseNegotiation.debug || {}),
      fluxoDescontoFixo: {
        tipo: "100%",
        valorFinal: totalComDesconto,
        entradaMinimaApi,
        parcelasCalculadas,
        dataPrimeiraParcela,
        dataDemaisParcelas,
      },
    },
  };
}

function sanitizeNegotiationParams({ tipoNegociacao, dataPagamento, valorEntrada }) {
  const parsedEntrada = String(valorEntrada || "").trim();

  return {
    status: "recalcular",
    params: {
      negTipo: Number(tipoNegociacao) || 2,
      vencPrimParcela: dataPagamento || null,
      ajusteData: Boolean(dataPagamento),
      valorEntradaSugerido: parsedEntrada ? toNumber(parsedEntrada) : 0,
    },
  };
}

async function loadNegotiationBase({
  token,
  idCon,
  idServ,
  carteira,
  dataPagamento,
  tipoNegociacao,
  dtSegundaParcela,
  valorEntrada = "",
  tpDesconto = "0",
  descontoManual = "",
}) {
  const payload = {
    carteira,
    idCon,
    idServ,
    dataPagamento,
    tipoNegociacao,
    valorEntrada,
    tpDesconto,
    descontoManual,
  };
  const cachedBase = getNegotiationBaseFromCache(payload);

  if (cachedBase) {
    return {
      ...cachedBase,
      fromCache: true,
    };
  }

  const cacheKey = buildNegotiationBaseCacheKey(payload);
  if (negotiationBaseInFlight.has(cacheKey)) {
    const value = await negotiationBaseInFlight.get(cacheKey);
    return {
      ...value,
      fromCache: true,
    };
  }

  const promise = (async () => {
    const baseOpcoesXml = await getOpcoesNegociacao({
      token,
      idCon,
      idServ,
      carteira,
      dataPagamento,
      descontoManual,
      valorEntrada,
      tpDesconto,
      parcelasNum: ZERO_INSTALLMENT_WALLETS.has(carteira) ? "0" : "",
      dtSegundaParcela,
    });

    const value = {
      baseOpcoesXml,
      discounts: extractAvailableDiscounts(baseOpcoesXml),
    };

    setNegotiationBaseCache(payload, value);
    return value;
  })();

  negotiationBaseInFlight.set(cacheKey, promise);

  try {
    const value = await promise;
    return {
      ...value,
      fromCache: false,
    };
  } finally {
    negotiationBaseInFlight.delete(cacheKey);
  }
}

async function hydrateDebtContext({
  telefone,
  carteira,
  idcon,
  allowCache = false,
}) {
  const cachedContext = allowCache
    ? getLookupContextFromCache({ telefone, carteira })
    : null;

  if (cachedContext) {
    const token = await getToken();
    return buildDebtContext({
      token,
      devedor: cachedContext.devedor,
      dividaXml: cachedContext.dividaXml,
      idcon,
    });
  }

  const token = await getToken();
  const devedorXml = await getDadosDevedor({ telefone, carteira, token });
  const devedor = extractDevedor(devedorXml);

  if (!devedor.cpfEncontrado) {
    const error = new Error(
      "Não foi possível localizar o CPF do cliente pelo telefone informado."
    );
    error.statusCode = 404;
    throw error;
  }

  const dividaXml = await getDadosDivida({
    cpf: devedor.cpf,
    carteira,
    token,
  });

  setLookupContextCache(
    { telefone, carteira },
    {
      devedor,
      dividaXml,
    }
  );

  return buildDebtContext({
    token,
    devedor,
    dividaXml,
    idcon,
  });
}

async function hydrateDebtContextFast({
  telefone,
  carteira,
  idcon,
  allowCache = false,
}) {
  const token = await getToken();
  const cachedContext = allowCache
    ? getLookupContextFromCache({ telefone, carteira })
    : null;
  const snapshot =
    cachedContext || (await loadLookupSnapshot({ telefone, carteira }));

  return buildDebtContext({
    token,
    devedor: snapshot.devedor,
    dividaXml: snapshot.dividaXml,
    idcon,
  });
}

async function listarIdcons(payload) {
  const context = await hydrateDebtContextFast({
    ...payload,
    allowCache: false,
  });
  return {
    ...context.dados,
    cpf: context.devedor.cpf,
    nome: context.devedor.nome,
  };
}

async function sugerirContraPropostaRiachuelo(payload) {
  const carteira = String(payload.carteira || "").trim().toUpperCase();

  if (carteira !== "RCHLO") {
    const error = new Error(
      "A sugestão de contra proposta está disponível apenas para a carteira Riachuelo."
    );
    error.statusCode = 400;
    throw error;
  }

  const context = await hydrateDebtContextFast({
    ...payload,
    allowCache: true,
  });

  const idCon = String(payload.idcon || context.dados.IdCon || "").trim();
  const contratoSelecionado =
    context.dados.ContratosIdcon.find(
      (item) => String(item.idcon) === String(idCon)
    ) || context.dados.ContratosIdcon[0] || null;
  const nomeFantasia =
    contratoSelecionado?.nomeFantasia || context.dados.NomeFantasia || "";
  const produto =
    context.dados.ProdutoDescricao ||
    context.dados.Descricao ||
    contratoSelecionado?.descricao ||
    "";
  const diasAtraso =
    contratoSelecionado?.diasAtraso || toInt(context.dados.DiasAtraso);
  const valorAtualizado =
    contratoSelecionado?.valorAtualizado || toNumber(context.dados.ValorAtualizado);
  const suggestion = await suggestCounterProposal({
    nomeFantasia,
    produto,
    diasAtraso,
    valorAtualizado,
  });

  return {
    ...suggestion,
    NomeCliente: context.dados.NomeCliente,
    PrimeiroNome: context.dados.PrimeiroNome,
    IdCon: idCon || contratoSelecionado?.idcon || "",
    Contrato:
      contratoSelecionado?.contrato ||
      context.dados.ContratoSelecionado ||
      context.dados.Contrato ||
      "",
    NomeFantasia: nomeFantasia,
    ProdutoDescricao: produto,
    DiasAtraso: diasAtraso,
    TipoSugestao: suggestion.usedFallback ? "fallback" : "historico",
  };
}

async function recalcularMensagemInternal(payload) {
  const context = await hydrateDebtContextFast({
    ...payload,
    allowCache: true,
  });
  const saneNode = sanitizeNegotiationParams(payload);
  const idCon = String(payload.idcon || context.dados.IdCon || "").trim();
  const contratoSelecionado =
    context.dados.ContratosIdcon.find(
      (contrato) => String(contrato.idcon) === String(idCon)
    ) || context.dados.ContratosIdcon[0] || null;
  const idServ = String(
    contratoSelecionado?.idServ || context.dados.IdServ || ""
  ).trim();
  const carteira = String(payload.carteira || "").trim().toUpperCase();
  const descontoManual = String(payload.descontoManual || "").trim();
  const valorEntradaInformado = String(payload.valorEntrada || "").trim();

  if (!idCon || !idServ) {
    const error = new Error(
      "Não foi possível identificar IdCon e IdServ para recalcular a negociação."
    );
    error.statusCode = 422;
    throw error;
  }

  if (MANUAL_DISCOUNT_WALLETS.has(carteira) && !descontoManual) {
    const error = new Error("Informe o desconto manual (%) para esta carteira.");
    error.statusCode = 400;
    throw error;
  }

  if (
    (API_FIXED_DISCOUNT_WALLETS.has(carteira) ||
      FIXED_MAX_DISCOUNT_WALLETS.has(carteira)) &&
    payload.parcelaPersonalizada
  ) {
    const parcelaPersonalizada = normalizeInstallmentCount(
      payload.parcelaPersonalizada
    );
    const limiteParcelas = getWalletCustomInstallmentLimit(carteira);
    if (
      !parcelaPersonalizada ||
      parcelaPersonalizada < 2 ||
      parcelaPersonalizada > limiteParcelas
    ) {
      const error = new Error(
        `Informe uma parcela personalizada entre 2 e ${limiteParcelas}.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const parseContext = {
    dadosNode: context.dados,
    saneNode,
    tipoNegociacao: payload.tipoNegociacao,
    vencPrimParcela: payload.dataPagamento,
  };
  const dataBaseCalculo = formatDateForDisplay(payload.dataPagamento);
  const dtSegundaParcela = addOneMonthKeepingDay(dataBaseCalculo);

  let opcoesXml = "";
  let negociacao = null;

  if (API_FIXED_DISCOUNT_WALLETS.has(carteira)) {
    const { baseOpcoesXml, discounts, fromCache } = await loadNegotiationBase({
      token: context.token,
      idCon,
      idServ,
      carteira,
      dataPagamento: payload.dataPagamento,
      tipoNegociacao: payload.tipoNegociacao,
      dtSegundaParcela,
    });

    const baseNegotiation = parseNegotiationOptions(baseOpcoesXml, parseContext);
    opcoesXml = baseOpcoesXml;
    negociacao = buildSuperDbNegotiation(baseNegotiation, discounts, {
      customInstallment: payload.parcelaPersonalizada,
      tipoNegociacao: payload.tipoNegociacao,
      dataPagamento: dataBaseCalculo,
      valorEntrada: valorEntradaInformado,
    });
    negociacao.debug = {
      ...(negociacao.debug || {}),
      cache: {
        ...(negociacao.debug?.cache || {}),
        tokenCacheAtivo: true,
        baseSuperDbEmCache: fromCache,
      },
    };
  } else if (FIXED_MAX_DISCOUNT_WALLETS.has(carteira)) {
    const {
      opcoesXml: gmateusOpcoesXml,
      totalAvista,
      entradaBase,
      parcelasCalculadas,
      resultadosParcelados,
    } = await loadGmateusNegotiation({
      token: context.token,
      idCon,
      idServ,
      carteira,
      dataPagamento: payload.dataPagamento,
      tipoNegociacao: payload.tipoNegociacao,
      dtSegundaParcela,
      valorEntrada: valorEntradaInformado,
      customInstallment: payload.parcelaPersonalizada,
    });

    opcoesXml = gmateusOpcoesXml;
    negociacao = parseNegotiationOptions(opcoesXml, parseContext);
    negociacao.debug = {
      ...(negociacao.debug || {}),
      fluxoDescontoFixo: {
        tipo: "100%",
        valorAvista: totalAvista,
        entradaBase,
        parcelasCalculadas,
        parcelasComRetorno: resultadosParcelados
          .filter((item) => item.xml)
          .map((item) => item.parcelas),
        parcelasComFallbackMinimo: resultadosParcelados
          .filter((item) => item.retriedWithMinimum)
          .map((item) => ({
            parcelas: item.parcelas,
            entradaAplicada: item.entryUsed,
            minimoApi: item.apiMinimumEntry,
          })),
      },
      cache: {
        ...(negociacao.debug?.cache || {}),
        tokenCacheAtivo: true,
      },
    };
  } else if (AUTO_CORRECTION_DISCOUNT_WALLETS.has(carteira)) {
    const {
      baseOpcoesXml,
      previewOpcoesXml,
      opcoesXml: topfamaOpcoesXml,
      maxCorrectionDiscount,
      valorAvista,
      entradaAplicada,
    } = await loadTopfamaNegotiation({
        token: context.token,
        idCon,
        idServ,
        carteira,
        dataPagamento: payload.dataPagamento,
        dtSegundaParcela,
        valorEntrada: valorEntradaInformado,
      });

    opcoesXml = topfamaOpcoesXml;
    negociacao = parseNegotiationOptions(opcoesXml, parseContext);
    negociacao.debug = {
      ...(negociacao.debug || {}),
      fluxoDescontoApi: {
        tipo: "correcao-maxima",
        percentualMaximoCorrecao: maxCorrectionDiscount,
        descontoCorrecaoAplicado:
          toNumber(takeTag("ValorDescontoNaCorrecao", normalizeSoapXml(opcoesXml))) ||
          0,
        valorAvistaComDesconto: valorAvista,
        entradaAplicada,
        valorEntradaApi:
          toNumber(takeTag("ValorEntrada", normalizeSoapXml(previewOpcoesXml))) || 0,
        baseSemDesconto:
          toNumber(takeTag("ValorTotalAcordo", normalizeSoapXml(baseOpcoesXml))) ||
          0,
      },
      cache: {
        ...(negociacao.debug?.cache || {}),
        tokenCacheAtivo: true,
      },
    };
  } else if (MANUAL_DISCOUNT_WALLETS.has(carteira)) {
    const { baseOpcoesXml, fromCache } = await loadNegotiationBase({
      token: context.token,
      idCon,
      idServ,
      carteira,
      dataPagamento: payload.dataPagamento,
      tipoNegociacao: payload.tipoNegociacao,
      dtSegundaParcela,
      valorEntrada: valorEntradaInformado,
      tpDesconto: "0",
    });

    const baseNegotiation = parseNegotiationOptions(baseOpcoesXml, parseContext);
    opcoesXml = baseOpcoesXml;
    negociacao = baseNegotiation;
    const manualSeeds = getManualOptionSeeds(baseNegotiation);

    if (manualSeeds.length > 0) {
      const manualResponses = await Promise.all(
        manualSeeds.map((seed) =>
          getOpcoesNegociacao({
            token: context.token,
            idCon,
            idServ,
            carteira,
            dataPagamento: payload.dataPagamento || seed.dataEntrada,
            descontoManual,
            valorEntrada:
              valorEntradaInformado ||
              formatNumberForSoap(seed.entrada ?? seed.total),
            tpDesconto: "2",
            parcelasNum: String(seed.parcelas || 1),
            valordemais: formatNumberForSoap(seed.parcela),
            valorTotalSugerido: formatNumberForSoap(seed.total),
            valorParcelaSugerido: formatNumberForSoap(seed.parcela),
            dtSegundaParcela,
          })
        )
      );

      const mergedManualXml = mergeNegotiationResponses(manualResponses);
      if (mergedManualXml) {
        opcoesXml = mergedManualXml;
        negociacao = parseNegotiationOptions(opcoesXml, parseContext);
        negociacao.debug = {
          ...(negociacao.debug || {}),
          fluxoDescontoManual: {
            etapas: 2,
            seedsBase: manualSeeds.length,
          },
          cache: {
            ...(negociacao.debug?.cache || {}),
            tokenCacheAtivo: true,
            baseManualEmCache: fromCache,
          },
        };
      }
    } else {
      negociacao.debug = {
        ...(negociacao.debug || {}),
        cache: {
          ...(negociacao.debug?.cache || {}),
          tokenCacheAtivo: true,
          baseManualEmCache: fromCache,
        },
      };
    }
  } else {
    opcoesXml = await getOpcoesNegociacao({
      token: context.token,
      idCon,
      idServ,
      carteira,
      dataPagamento: payload.dataPagamento,
      descontoManual,
      valorEntrada: valorEntradaInformado,
      dtSegundaParcela,
    });

    negociacao = parseNegotiationOptions(opcoesXml, parseContext);
  }

  const result = {
    ...negociacao,
    NomeCliente: context.dados.NomeCliente,
    PrimeiroNome: context.dados.PrimeiroNome,
    ContratosIdcon: context.dados.ContratosIdcon,
    Contrato: context.dados.Contrato,
    ContratoSelecionado: context.dados.ContratoSelecionado,
    IdCon: idCon,
    IdServ: idServ,
    Agrupamento: context.dados.Agrupamento,
    TipoNegociacaoFiltro: saneNode.params.negTipo,
  };

  return result;
}

async function recalcularMensagem(payload) {
  const cachedResult = getRecalculationResultFromCache(payload);
  if (cachedResult) {
    return cachedResult;
  }

  const cacheKey = buildRecalculationCacheKey(payload);
  if (recalculationInFlight.has(cacheKey)) {
    return recalculationInFlight.get(cacheKey);
  }

  const promise = recalcularMensagemInternal(payload);
  recalculationInFlight.set(cacheKey, promise);

  try {
    const result = await promise;
    setRecalculationResultCache(payload, result);
    return result;
  } finally {
    recalculationInFlight.delete(cacheKey);
  }
}

module.exports = {
  listarIdcons,
  recalcularMensagem,
  sanitizeNegotiationParams,
  sugerirContraPropostaRiachuelo,
};
