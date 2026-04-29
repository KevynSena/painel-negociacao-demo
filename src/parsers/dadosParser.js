const {
  cleanContractNumber,
  normalizeSoapXml,
  normalizeText,
  takeAll,
  takeTag,
  toBool,
  toInt,
  toNumber,
} = require("../utils/xml");

function parseDebtData(xml, selectedIdCon = "") {
  const normalizedXml = normalizeSoapXml(xml);
  const selectedId = String(selectedIdCon || "").trim();

  const idConRaw =
    takeTag("IDCON", normalizedXml) || takeTag("IdCon", normalizedXml);
  let IdServ =
    takeTag("IDSERV", normalizedXml) || takeTag("IdServ", normalizedXml);
  const Agrupamento = takeTag("Agrupamento", normalizedXml).trim();

  const flagPossui =
    String(takeTag("PossuiAcordo", normalizedXml) || "")
      .trim()
      .toLowerCase() === "true";
  const NumeroAcordo =
    takeTag("NumeroAcordo", normalizedXml) ||
    takeTag("IdAcordo", normalizedXml) ||
    takeTag("Numero", normalizedXml);
  const UrlPagamento = takeTag("UrlPagamento", normalizedXml);
  const SituacaoAcordo =
    takeTag("SituacaoAcordo", normalizedXml) ||
    takeTag("StatusAcordo", normalizedXml);
  const blocoAcordo = /<Acordo>[\s\S]*?<\/Acordo>/i.test(normalizedXml);
  const PossuiAcordo = Boolean(
    flagPossui || NumeroAcordo || UrlPagamento || blocoAcordo
  );

  const parcelasRaw = [
    ...Array.from(
      normalizedXml.matchAll(
        /<ParcelaAcordo[^>]*>([\s\S]*?)<\/ParcelaAcordo>/gi
      )
    ).map((match) => match[1]),
    ...Array.from(
      normalizedXml.matchAll(
        /<AcordoParcela[^>]*>([\s\S]*?)<\/AcordoParcela>/gi
      )
    ).map((match) => match[1]),
    ...Array.from(
      (takeTag("Acordo", normalizedXml) || "").matchAll(
        /<Parcela[^>]*>([\s\S]*?)<\/Parcela>/gi
      )
    ).map((match) => match[1]),
  ];

  const ParcelasAcordo = parcelasRaw
    .map((block) => ({
      Numero: toInt(takeTag("Numero", block) || takeTag("NumParcela", block)),
      DataVencimento:
        takeTag("Vencimento", block) || takeTag("DataVencimento", block) || "",
      ValorParcela: toNumber(
        takeTag("ValorParcela", block) ||
          takeTag("Valor", block) ||
          takeTag("ValorNegociarParcela", block)
      ),
      IDParcela:
        takeTag("IDParcela", block) ||
        takeTag("IdParcela", block) ||
        takeTag("IdBoleto", block) ||
        takeTag("Id", block) ||
        "",
      ValorPago: toNumber(takeTag("ValorPago", block) || "0"),
      BoletoLiberado: toBool(
        takeTag("BoletoLiberado", block) ||
          takeTag("Liberado", block) ||
          "0"
      ),
      LinhaDigitavel: takeTag("LinhaDigitavel", block) || "",
      NossoNumero: takeTag("NossoNumero", block) || "",
    }))
    .sort((left, right) => left.Numero - right.Numero);

  const ParcelaEmitivel =
    ParcelasAcordo.find(
      (item) => item.ValorPago === 0 && !item.BoletoLiberado
    ) || ParcelasAcordo.find((item) => item.ValorPago === 0) || null;

  const NomeCliente =
    takeTag("NomeCliente", normalizedXml) || takeTag("Nome", normalizedXml) || "";
  const PrimeiroNome = NomeCliente ? NomeCliente.split(/\s+/)[0] : "";
  const Mensagem = takeTag("Mensagem", normalizedXml).trim();
  const MensagemAdicional = takeTag("MensagemAdicional", normalizedXml).trim();
  const CodigoMensagem = takeTag("CodigoMensagem", normalizedXml).trim();
  const TipoNegociacao = takeTag("TipoNegociacao", normalizedXml).trim();

  let Descricao = "";
  let DiasAtraso = "";
  let ValorOriginal = "";
  let ValorAtualizado = "";
  let DataDevolucao = "";

  const primeiraDividaMatch = normalizedXml.match(
    /<Divida[^>]*>([\s\S]*?)<\/Divida>/i
  );

  if (primeiraDividaMatch) {
    const debtBlock = primeiraDividaMatch[1];
    Descricao = takeTag("Descricao", debtBlock).trim();
    DiasAtraso = takeTag("DiasAtraso", debtBlock).trim();
    ValorOriginal = takeTag("ValorOriginal", debtBlock).trim();
    ValorAtualizado = takeTag("ValorAtualizado", debtBlock).trim();
    DataDevolucao = takeTag("DataDevolucao", debtBlock).trim();
  }

  const rawContracts = Array.from(
    normalizedXml.matchAll(
      /<Contrato>\s*<Agrupamento>[\s\S]*?<Contrato>([\s\S]*?)<\/Contrato>[\s\S]*?<IDCON>([\s\S]*?)<\/IDCON>[\s\S]*?<\/Contrato>/gi
    )
  ).map((match) => {
    const block = match[0];
    const idcon = String(match[2] || "").trim();
    const contrato = cleanContractNumber(match[1]);
    const primeiraDividaDoContrato = block.match(
      /<Divida[^>]*>([\s\S]*?)<\/Divida>/i
    );
    const debtBlock = primeiraDividaDoContrato ? primeiraDividaDoContrato[1] : block;
    const descricao = takeTag("Descricao", debtBlock).trim();
    const nomeFantasia = takeTag("NomeFantasia", block).trim();
    const numeroTitulo = takeTag("NumeroTitulo", block).trim();
    const idServ = (
      takeTag("IDSERV", block) || takeTag("IdServ", block) || ""
    ).trim();
    const valorAtualizadoContrato = Array.from(
      block.matchAll(/<ValorAtualizado[^>]*>([\s\S]*?)<\/ValorAtualizado>/gi)
    )
      .map((valueMatch) => toNumber(valueMatch[1]))
      .reduce((total, current) => total + current, 0);
    const diasAtrasoContrato = toInt(takeTag("DiasAtraso", block));
    const agrupamentoContrato = takeTag("Agrupamento", block).trim();

    return {
      idcon,
      contrato,
      descricao,
      nomeFantasia,
      numeroTitulo,
      idServ,
      valorAtualizado: valorAtualizadoContrato,
      diasAtraso: diasAtrasoContrato,
      agrupamento: agrupamentoContrato,
      selecionado: Boolean(selectedId && idcon === selectedId),
    };
  });

  const groupedContracts = [];
  const contractsMap = new Map();

  for (const contract of rawContracts) {
    const key = contract.idcon || contract.contrato;
    if (!key) continue;

    if (!contractsMap.has(key)) {
      contractsMap.set(key, {
        ...contract,
      });
      groupedContracts.push(contractsMap.get(key));
      continue;
    }

    const target = contractsMap.get(key);
    target.valorAtualizado += contract.valorAtualizado || 0;
    target.descricao = target.descricao || contract.descricao;
    target.contrato = target.contrato || contract.contrato;
    target.nomeFantasia = target.nomeFantasia || contract.nomeFantasia;
    target.numeroTitulo = target.numeroTitulo || contract.numeroTitulo;
    target.idServ = target.idServ || contract.idServ;
    target.diasAtraso = Math.max(target.diasAtraso || 0, contract.diasAtraso || 0);
    target.agrupamento = target.agrupamento || contract.agrupamento;
    target.selecionado = target.selecionado || contract.selecionado;
  }

  let IdCon = String(idConRaw || "").trim();
  if (!IdCon && groupedContracts.length > 0) {
    IdCon = groupedContracts[0].idcon;
  }

  const matchedContract = selectedId
    ? groupedContracts.find((item) => String(item.idcon) === selectedId)
    : null;
  const firstContract = groupedContracts[0] || null;

  const ContratoSelecionado = matchedContract?.contrato || "";
  const Contrato =
    ContratoSelecionado ||
    groupedContracts.find((item) => item.contrato)?.contrato ||
    "";
  IdServ =
    matchedContract?.idServ ||
    firstContract?.idServ ||
    String(IdServ || "").trim();
  const NomeFantasia =
    matchedContract?.nomeFantasia ||
    firstContract?.nomeFantasia ||
    takeTag("NomeFantasia", normalizedXml).trim();
  if (matchedContract?.descricao) {
    Descricao = matchedContract.descricao;
  }
  if (matchedContract?.diasAtraso) {
    DiasAtraso = String(matchedContract.diasAtraso);
  }
  if (matchedContract?.valorAtualizado) {
    ValorAtualizado = String(matchedContract.valorAtualizado);
  }

  const descricoesDivida = takeAll("Descricao", normalizedXml).map((value) =>
    String(value || "").trim().toLowerCase()
  );
  const hasCartaoPl = descricoesDivida.some(
    (value) => value === "cartao pl" || value === "cartão pl"
  );

  let SaldoAVencerOriginal = 0;
  let SaldoAVencerAtualizado = 0;
  let SaldoAVencerDataVencimento = "";
  let SaldoAVencerDiasAtraso = "";

  const tituloBlocks = Array.from(
    normalizedXml.matchAll(
      /<NumeroTitulo[^>]*>([\s\S]*?)<\/NumeroTitulo>([\s\S]*?)(?=<NumeroTitulo[^>]*>|$)/gi
    )
  );

  for (const match of tituloBlocks) {
    const titulo = String(match[1] || "").trim();
    const block = String(match[0] || "");

    if (normalizeText(titulo) === "SALDO A VENCER") {
      SaldoAVencerOriginal = toNumber(takeTag("ValorOriginal", block));
      SaldoAVencerAtualizado = toNumber(takeTag("ValorAtualizado", block));
      SaldoAVencerDataVencimento = takeTag("DataVencimento", block).trim();
      SaldoAVencerDiasAtraso = takeTag("DiasAtraso", block).trim();
      break;
    }
  }

  const Titulos = Array.from(
    normalizedXml.matchAll(/<NumeroTitulo[^>]*>([^<]+)<\/NumeroTitulo>/gi)
  )
    .map((match) => String(match[1] || "").trim())
    .filter((titulo) => titulo && normalizeText(titulo) !== "SALDO A VENCER");

  return {
    PossuiAcordo,
    NumeroAcordo,
    UrlPagamento,
    SituacaoAcordo,
    ParcelasAcordo,
    ParcelaEmitivel,
    TemParcelaEmitivel: Boolean(ParcelaEmitivel),
    IdCon,
    IdServ,
    Agrupamento,
    TipoNegociacao,
    NomeCliente,
    PrimeiroNome,
    Mensagem,
    MensagemAdicional,
    CodigoMensagem,
    Contrato,
    ContratoSelecionado,
    Descricao,
    ProdutoDescricao: Descricao,
    NomeFantasia,
    DiasAtraso,
    ValorOriginal,
    ValorAtualizado,
    DataDevolucao,
    Produto: hasCartaoPl ? "Cartão da loja" : undefined,
    Titulos,
    ContratosIdcon: groupedContracts,
    TemSaldoAVencer:
      SaldoAVencerOriginal > 0 || SaldoAVencerAtualizado > 0,
    SaldoAVencerOriginal,
    SaldoAVencerAtualizado,
    SaldoAVencerDataVencimento,
    SaldoAVencerDiasAtraso,
    IdConFromWebhook: selectedId,
  };
}

module.exports = {
  parseDebtData,
};
