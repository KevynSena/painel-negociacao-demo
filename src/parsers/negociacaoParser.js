const {
  formatCurrencyBR,
  formatDateBR,
  normalizeSoapXml,
  takeTag,
  toInt,
  toNumber,
} = require("../utils/xml");

const MIN_ENTRADA_RCHLO = 70;
const MIN_PARCELA_RCHLO = 50;
const MAX_AGREEMENTS_FALLBACK = 5;

function planoKind(plano) {
  if (!plano) return null;
  const normalized = String(plano).toLowerCase().trim();

  if (normalized.startsWith("debit") || normalized.startsWith("débito") || normalized.startsWith("debito")) {
    return "debit";
  }
  if (
    normalized.startsWith("acquittance") ||
    normalized.includes("quitacao") ||
    normalized.includes("quitação")
  ) {
    return "acquittance";
  }
  if (
    normalized.startsWith("agreement") ||
    normalized.startsWith("agrement") ||
    normalized.startsWith("acordo")
  ) {
    return "agreement";
  }
  if (
    normalized.startsWith("invoicement") ||
    normalized.startsWith("parcelamento") ||
    normalized.includes("parcelamento parcial")
  ) {
    return "invoicement";
  }

  return null;
}

function normPlanoToCategoria(plano) {
  const kind = planoKind(plano);
  if (kind === "debit") return "avista";
  if (kind === "acquittance") return "quitacao";
  if (kind === "agreement") return "parcelado";
  if (kind === "invoicement") return "parcial";
  return "outro";
}

function ehParcelado(categoria, parcelasNum) {
  if (parcelasNum === 1) return false;
  return categoria === "parcelado" || (categoria === "parcial" && (parcelasNum ?? 1) > 1);
}

function calcParcelas({ categoria, entrada, parcela, total, parcelasNum }) {
  if (parcelasNum === 1) return 1;
  if (!ehParcelado(categoria, parcelasNum)) return 1;
  if (parcelasNum && parcelasNum > 1) return parcelasNum;

  if (!parcela || !total) {
    return parcelasNum && parcelasNum > 1 ? parcelasNum : 2;
  }

  const base = (total - (entrada ?? 0)) / parcela;
  let amount = Math.round(base + 1);

  if (!Number.isFinite(amount) || amount < 2) {
    amount = 2;
  }

  let best = amount;
  let bestError = Infinity;

  for (const candidate of [amount - 1, amount, amount + 1]) {
    if (candidate < 2) continue;

    const totalCandidate = (entrada ?? 0) + (candidate - 1) * parcela;
    const error = Math.abs(totalCandidate - total);

    if (error < bestError) {
      best = candidate;
      bestError = error;
    }
  }

  return best;
}

function makeTituloRiachuelo(option, parcelas) {
  const isParcelado = ehParcelado(option.categoria, parcelas);

  if (isParcelado) {
    const restantes = Math.max(0, (parcelas ?? 1) - 1);
    const entradaTexto =
      option.entrada != null && option.entrada > 0
        ? `Entrada de ${formatCurrencyBR(option.entrada)}`
        : null;
    const parcelaTexto =
      option.parcela != null && restantes > 0
        ? `${restantes}x de ${formatCurrencyBR(option.parcela)}`
        : null;

    if (entradaTexto && parcelaTexto) return `${entradaTexto} + ${parcelaTexto}`;
    if (parcelaTexto) return parcelaTexto;
    if (entradaTexto) return `${formatCurrencyBR(option.entrada)} de entrada`;
  }

  if (option.kind === "debit") {
    return `Fatura atualizada - ${formatCurrencyBR(option.total)}`;
  }

  if (option.kind === "acquittance") {
    return `Quitação total - ${formatCurrencyBR(option.total)}`;
  }

  return `${formatCurrencyBR(option.total)} à vista`;
}

function formatProdutoHeaderPhrase(produto) {
  const value = String(produto || "").trim();
  const normalized = value.toLowerCase();

  if (!value) return "";
  if (normalized === "fatura") return "da sua fatura";
  if (normalized === "empréstimo" || normalized === "emprestimo") {
    return "do seu empréstimo";
  }
  if (normalized === "cartão" || normalized === "cartao") {
    return "do seu cartão";
  }
  if (normalized === "cartão da loja" || normalized === "cartao da loja") {
    return "do seu cartão da loja";
  }

  return `do seu ${value}`;
}

function buildPayloadOption(option, parcelas) {
  return {
    categoria: option.categoria,
    kind: option.kind || null,
    parcelas,
    entrada: option.entrada,
    parcela: option.parcela,
    total: option.total,
    codigoFaixa: option.codigoFaixa,
    descricaoFaixa: option.descricaoFaixa,
    plano: option.plano,
    dataEntrada: formatDateBR(option.dtEntradaISO),
    dataPrimeiraParcela: formatDateBR(option.dtPrimeiraISO),
    diaDemaisParcelas: (() => {
      const date = new Date(option.dtPrimeiraISO);
      return Number.isNaN(date.getTime())
        ? null
        : String(date.getDate()).padStart(2, "0");
    })(),
  };
}

function buildFallbackMessage() {
  return {
    totalOpcoes: 0,
    opcoes_zap: [],
    mensagem_zap: "",
    mensagens_zap: [],
    mensagens_zap_por_opcao: [],
    mensagem_zap_unica:
      "Não encontrei opções de negociação para os filtros informados.",
    payload_by_id: {},
    linhas_texto: [
      "Não encontrei opções de negociação para os filtros informados.",
    ],
    opcoes_compact: "",
    regrasAplicadas: {
      minEntradaParcelado: MIN_ENTRADA_RCHLO,
      minParcelaParcelado: MIN_PARCELA_RCHLO,
    },
    debug: {},
  };
}

function parseNegotiationOptions(xml, context = {}) {
  const normalizedXml = normalizeSoapXml(xml);
  const dadosNode = context.dadosNode || {};
  const saneNode = context.saneNode || {};
  const params = saneNode.params || {};
  const tipoNeg = Number(params.negTipo || context.tipoNegociacao || 0) || 0;
  const vencPrimParcela = params.vencPrimParcela || context.vencPrimParcela || null;

  const produtoBase =
    dadosNode.ProdutoDescricao ||
    dadosNode.Produto ||
    dadosNode.Descricao ||
    dadosNode.descricao ||
    "cartão";

  const agrupamento = String(
    dadosNode.Agrupamento || dadosNode.agrupamento || ""
  ).toUpperCase();
  const produto =
    agrupamento === "GMATEUS" && /^\d+$/.test(String(produtoBase || "").trim())
      ? "fatura"
      : produtoBase;

  const contratoHeader =
    dadosNode.ContratoSelecionado ||
    dadosNode.Contrato ||
    dadosNode.NumeroContrato ||
    dadosNode.NumContrato ||
    dadosNode.ContratoId ||
    dadosNode.ContratoNumero ||
    null;

  if (agrupamento === "BEMOL") {
    return parseBemolOptions(normalizedXml, {
      contratoHeader,
      produto,
      tipoNeg,
      vencPrimParcela,
      params,
      saneNode,
      agrupamento,
    });
  }

  return parseRchloOptions(normalizedXml, {
    contratoHeader,
    produto,
    tipoNeg,
    vencPrimParcela,
    params,
    saneNode,
    agrupamento,
  });
}

function parseBemolOptions(xml, context) {
  const matches = Array.from(
    xml.matchAll(/<OpcoesNegociacao[^>]*>([\s\S]*?)<\/OpcoesNegociacao>/gi)
  );

  const allOptions = matches.map((match) => {
    const block = match[1];
    const plano = takeTag("Plano", block);
    const codigoFaixa = takeTag("CodigoFaixa", block);
    const descricaoFaixa = takeTag("DescricaoFaixa", block);
    const total =
      toNumber(takeTag("ValorTotalAcordo", block)) ||
      toNumber(takeTag("ValorCorrigido", block)) ||
      toNumber(takeTag("ValorNegociar", block)) ||
      toNumber(takeTag("ValorPrimeira", block));

    const dtEntradaISO = takeTag("VencimentoPrimeira", block);
    const parcelas = Array.from(
      block.matchAll(/<Parcelas[^>]*>([\s\S]*?)<\/Parcelas>/gi)
    )
      .map((parcelMatch) => parcelMatch[1])
      .filter((parcelBlock) => /<Numero>/i.test(parcelBlock))
      .map((parcelBlock) => ({
        numeroParcelas: toInt(takeTag("Numero", parcelBlock)),
        entrada: toNumber(takeTag("ValorEntrada", parcelBlock)),
        parcela: toNumber(takeTag("ValorDemaisParcelas", parcelBlock)),
        dtPrimeiraISO: takeTag("DataVencimento", parcelBlock) || dtEntradaISO,
      }));

    const mainParcel =
      parcelas[0] || {
        numeroParcelas: 1,
        entrada: null,
        parcela: null,
        dtPrimeiraISO: dtEntradaISO,
      };

    return {
      plano,
      codigoFaixa,
      descricaoFaixa,
      numeroParcelas: mainParcel.numeroParcelas || 1,
      entrada: mainParcel.entrada,
      parcela: mainParcel.parcela,
      total,
      categoria: (mainParcel.numeroParcelas || 1) === 1 ? "avista" : "parcelado",
      dtEntradaISO,
      dtPrimeiraISO: mainParcel.dtPrimeiraISO,
    };
  });

  let filtered = allOptions.filter((item) => typeof item.total === "number");
  if (filtered.length === 0 && allOptions.length > 0) {
    filtered = allOptions.slice();
  }

  const seen = new Set();
  filtered = filtered.filter((item) => {
    const key = `${item.total}|${item.entrada}|${item.parcela}|${item.numeroParcelas}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  filtered.sort((left, right) => (left.total ?? 0) - (right.total ?? 0));

  if (filtered.length === 0) {
    return buildFallbackMessage();
  }

  const opcoes_zap = [];
  const payload_by_id = {};
  const linhas = [];

  filtered.forEach((item, index) => {
    const id = `opt_${index + 1}`;
    const parcelas = item.numeroParcelas || 1;
    let label = "";

    if (parcelas === 1) {
      label = `À vista por ${formatCurrencyBR(item.total ?? item.entrada)}`;
    } else if (item.entrada != null && item.parcela != null) {
      const restantes = Math.max(1, parcelas - 1);
      label = `Entrada de ${formatCurrencyBR(item.entrada)} + ${restantes}x de ${formatCurrencyBR(item.parcela)}`;
    } else if (item.parcela != null && (!item.entrada || item.entrada === 0)) {
      label = `${parcelas}x de ${formatCurrencyBR(item.parcela)}`;
    } else {
      label = `${formatCurrencyBR(item.total)} em ${parcelas} parcelas`;
    }

    opcoes_zap.push({ id, label });
    linhas.push(`${index + 1}) ${label}`);
    payload_by_id[id] = buildPayloadOption(
      {
        ...item,
        kind: null,
      },
      parcelas
    );
  });

  const header = context.contratoHeader
    ? `Selecionei as melhores opções de pagamento do contrato ${context.contratoHeader}:`
    : "Selecionei as melhores opções de pagamento do contrato em negociação:";

  const dataCTA = formatDateBR(
    filtered[0].dtEntradaISO || filtered[0].dtPrimeiraISO || null
  );
  const cta = dataCTA
    ? `Podemos formalizar qual opção de pagamento para o dia ${dataCTA}?`
    : "Podemos formalizar qual opção de pagamento?";

  return {
    totalOpcoes: opcoes_zap.length,
    opcoes_zap,
    mensagem_zap: linhas.join("\n"),
    mensagens_zap: [...linhas],
    mensagens_zap_por_opcao: [
      { id: "opt_header_recalc", numero: null, texto: header },
      ...opcoes_zap.map((option, index) => ({
        id: option.id,
        numero: index + 1,
        texto: `${index + 1}) ${option.label}`,
      })),
      { id: "opt_cta", numero: null, texto: cta },
    ],
    mensagem_zap_unica: [header, "", ...linhas.flatMap((item) => [item, ""]), cta]
      .join("\n")
      .trim(),
    payload_by_id,
    linhas_texto: [
      "Encontrei estas opções de negociação:",
      ...linhas,
      "Responda com o número da opção desejada.",
    ],
    opcoes_compact: linhas.join(" | "),
    regrasAplicadas: {
      minEntradaParcelado: null,
      minParcelaParcelado: null,
    },
    debug: {
      tipoNegUsado: context.tipoNeg,
      categoriasEncontradas: filtered.reduce((accumulator, item) => {
        accumulator[item.categoria] = (accumulator[item.categoria] || 0) + 1;
        return accumulator;
      }, {}),
      kindsEncontrados: {},
      qtdBrutoOpcoes: allOptions.length,
      vencPrimParcela: context.vencPrimParcela,
      params: context.params,
      saneNode: context.saneNode,
      produto: context.produto,
      contratoHeader: context.contratoHeader,
      agrupamento: context.agrupamento,
    },
  };
}

function parseRchloOptions(xml, context) {
  const matches = Array.from(
    xml.matchAll(/<OpcoesNegociacao[^>]*>([\s\S]*?)<\/OpcoesNegociacao>/gi)
  );

  const allOptions = [];

  for (const match of matches) {
    const block = match[1];
    const plano = takeTag("Plano", block);
    const codigoFaixa = takeTag("CodigoFaixa", block);
    const descricaoFaixa = takeTag("DescricaoFaixa", block);
    const parcelasNum = toInt(takeTag("ParcelasNum", block));
    const valorPrimeira = toNumber(takeTag("ValorPrimeira", block));
    const total =
      toNumber(takeTag("ValorTotalAcordo", block)) ||
      toNumber(takeTag("TotalSemDesconto", block)) ||
      toNumber(takeTag("ValorCorrigido", block));
    let kind = planoKind(plano);
    let categoria = normPlanoToCategoria(plano);
    if (context.agrupamento === "GMATEUS" && !kind) {
      kind = parcelasNum <= 1 ? "debit" : "agreement";
      categoria = parcelasNum <= 1 ? "avista" : "parcelado";
    }
    const dtEntradaISO = takeTag("VencimentoPrimeira", block);

    if (context.agrupamento === "GMATEUS") {
      allOptions.push({
        plano,
        codigoFaixa,
        descricaoFaixa,
        parcelasNum: parcelasNum || 1,
        entrada: parcelasNum > 1 ? valorPrimeira || null : null,
        parcela:
          parcelasNum > 1
            ? toNumber(takeTag("ValorDemaisParcelas", block)) || null
            : null,
        total,
        categoria,
        kind,
        dtEntradaISO,
        dtPrimeiraISO: dtEntradaISO,
      });
      continue;
    }

    const subParcelas = Array.from(
      block.matchAll(/<Parcelas[^>]*>\s*<Numero>[\s\S]*?<\/Parcelas>/gi)
    )
      .map((parcelMatch) => parcelMatch[0])
      .map((parcelBlock) => ({
        parcelasNum: toInt(takeTag("Numero", parcelBlock)),
        entrada: toNumber(takeTag("ValorEntrada", parcelBlock)),
        parcela: toNumber(takeTag("ValorDemaisParcelas", parcelBlock)),
        total: toNumber(takeTag("ValorTotalAcordo", parcelBlock)) || total,
        dtPrimeiraISO: takeTag("DataVencimento", parcelBlock) || dtEntradaISO,
      }));

    if (subParcelas.length === 0) {
      if (context.agrupamento === "TOPFAMA" && !kind) {
        kind = (parcelasNum || 1) <= 1 ? "debit" : "agreement";
        categoria = (parcelasNum || 1) <= 1 ? "avista" : "parcelado";
      }
      allOptions.push({
        plano,
        codigoFaixa,
        descricaoFaixa,
        parcelasNum: parcelasNum || 1,
        entrada: valorPrimeira || null,
        parcela: null,
        total,
        categoria,
        kind,
        dtEntradaISO,
        dtPrimeiraISO: dtEntradaISO,
      });
      continue;
    }

    subParcelas.forEach((parcel) => {
      const optionKind =
        context.agrupamento === "TOPFAMA" && !kind
          ? (parcel.parcelasNum || parcelasNum || 1) <= 1
            ? "debit"
            : "agreement"
          : kind;
      const optionCategoria =
        context.agrupamento === "TOPFAMA" && !kind
          ? (parcel.parcelasNum || parcelasNum || 1) <= 1
            ? "avista"
            : "parcelado"
          : categoria;
      allOptions.push({
        plano,
        codigoFaixa,
        descricaoFaixa,
        parcelasNum: parcel.parcelasNum || parcelasNum,
        entrada: parcel.entrada,
        parcela: parcel.parcela,
        total: parcel.total,
        categoria: optionCategoria,
        kind: optionKind,
        dtEntradaISO,
        dtPrimeiraISO: parcel.dtPrimeiraISO,
      });
    });
  }

  function passaMinimosRiachuelo(option) {
    if (context.agrupamento === "TOPFAMA") {
      if (!ehParcelado(option.categoria, option.parcelasNum)) return true;
      return (option.parcela ?? 0) >= 50;
    }
    if (!ehParcelado(option.categoria, option.parcelasNum)) return true;
    if (option.kind === "invoicement") return true;

    const entrada = option.entrada ?? 0;
    const quantidadeRestante = Math.max(1, (option.parcelasNum ?? 2) - 1);
    const parcela =
      option.parcela != null
        ? option.parcela
        : (option.total - (option.entrada ?? 0)) / quantidadeRestante;

    return entrada >= MIN_ENTRADA_RCHLO && parcela >= MIN_PARCELA_RCHLO;
  }

  let filtered = allOptions.filter(
    (option) =>
      typeof option.total === "number" &&
      (typeof option.entrada === "number" || option.entrada === null)
  );

  filtered = filtered.filter(passaMinimosRiachuelo);

  let base = filtered;

  if (context.tipoNeg === 1) {
    if (context.agrupamento === "TOPFAMA") {
      filtered = base.filter(
        (option) =>
          option.kind === "debit" ||
          option.kind === "agreement" ||
          option.kind === "invoicement" ||
          option.kind === "acquittance" ||
          option.categoria === "avista" ||
          (option.parcelasNum ?? 1) <= 1
      );
    } else {
    let selected = base.filter(
      (option) => option.kind === "debit" || option.kind === "invoicement"
    );
    const hasInvoicement = selected.some(
      (option) => option.kind === "invoicement"
    );

    if (!hasInvoicement) {
      const agreements = base
        .filter((option) => option.kind === "agreement")
        .sort((left, right) => (left.total ?? 0) - (right.total ?? 0))
        .slice(0, MAX_AGREEMENTS_FALLBACK);
      selected = [...selected, ...agreements];
    }

    filtered = selected;
    }
  } else if (context.tipoNeg === 2) {
    filtered = base.filter(
      (option) => option.kind === "acquittance" || option.kind === "agreement"
    );
  }

  const seen = new Set();
  filtered = filtered.filter((option) => {
    const key = `${option.kind}|${option.total}|${option.entrada}|${option.parcela}|${option.parcelasNum}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  filtered.sort((left, right) => (left.total ?? 0) - (right.total ?? 0));

  if (filtered.length === 0) {
    return buildFallbackMessage();
  }

  const opcoes_zap = [];
  const payload_by_id = {};
  const linhas = [];

  filtered.forEach((option, index) => {
    const id = `opt_${index + 1}`;
    const parcelas = calcParcelas({
      categoria: option.categoria,
      entrada: option.entrada,
      parcela: option.parcela,
      total: option.total,
      parcelasNum: option.parcelasNum,
    });
    const label = makeTituloRiachuelo(option, parcelas);

    opcoes_zap.push({ id, label });
    linhas.push(`${index + 1}) ${label}`);
    payload_by_id[id] = buildPayloadOption(option, parcelas);
  });

  const contratoParaRegra = String(context.contratoHeader || "").trim();
  const nomeProdutoHeader =
    context.agrupamento === "RCHLO" &&
    contratoParaRegra &&
    !contratoParaRegra.startsWith("102")
      ? "empréstimo"
      : context.produto;

  let header = "";
  const produtoHeaderPhrase = formatProdutoHeaderPhrase(nomeProdutoHeader);
  if (nomeProdutoHeader && context.contratoHeader) {
    header = `Selecionei as melhores opções de pagamento ${produtoHeaderPhrase}, contrato ${context.contratoHeader}:`;
  } else if (nomeProdutoHeader) {
    header = `Selecionei as melhores opções de pagamento ${produtoHeaderPhrase}:`;
  } else if (context.contratoHeader) {
    header = `Selecionei as melhores opções de pagamento do seu contrato ${context.contratoHeader}:`;
  } else {
    header = "Selecionei as melhores opções de pagamento:";
  }

  const dataCTA = formatDateBR(
    filtered[0].dtEntradaISO || filtered[0].dtPrimeiraISO || null
  );
  const cta = dataCTA
    ? `Podemos formalizar qual opção de pagamento para o dia ${dataCTA}?`
    : "Podemos formalizar qual opção de pagamento?";

  return {
    totalOpcoes: opcoes_zap.length,
    opcoes_zap,
    mensagem_zap: linhas.join("\n"),
    mensagens_zap: [...linhas],
    mensagens_zap_por_opcao: [
      { id: "opt_header_recalc", numero: null, texto: header },
      ...opcoes_zap.map((option, index) => ({
        id: option.id,
        numero: index + 1,
        texto: `${index + 1}) ${option.label}`,
      })),
      { id: "opt_cta", numero: null, texto: cta },
    ],
    mensagem_zap_unica: [header, "", ...linhas.flatMap((item) => [item, ""]), cta]
      .join("\n")
      .trim(),
    payload_by_id,
    linhas_texto: [
      "Encontrei estas opções de negociação:",
      ...linhas,
      "Responda com o número da opção desejada.",
    ],
    opcoes_compact: linhas.join(" | "),
    regrasAplicadas: {
      minEntradaParcelado: MIN_ENTRADA_RCHLO,
      minParcelaParcelado: MIN_PARCELA_RCHLO,
    },
    debug: {
      tipoNegUsado: context.tipoNeg,
      categoriasEncontradas: filtered.reduce((accumulator, option) => {
        accumulator[option.categoria] = (accumulator[option.categoria] || 0) + 1;
        return accumulator;
      }, {}),
      kindsEncontrados: filtered.reduce((accumulator, option) => {
        accumulator[option.kind] = (accumulator[option.kind] || 0) + 1;
        return accumulator;
      }, {}),
      qtdBrutoOpcoes: allOptions.length,
      vencPrimParcela: context.vencPrimParcela,
      params: context.params,
      saneNode: context.saneNode,
      produto: context.produto,
      contratoHeader: context.contratoHeader,
      contratoParaRegra,
      nomeProdutoHeaderRchlo: nomeProdutoHeader,
      agrupamento: context.agrupamento,
    },
  };
}

module.exports = {
  parseNegotiationOptions,
};
