const { config } = require("../config");
const { formatCurrencyBR, onlyDigits } = require("../utils/xml");

const DEMO_PHONE = process.env.DEMO_PHONE || "11999999999";

const demoContracts = [
  {
    idcon: "DEMO-RCHLO-001",
    idServ: "1",
    contrato: "RCHLO-DEMO-001",
    descricao: "Cartao private label",
    nomeFantasia: "Riachuelo Cyber - 162",
    numeroTitulo: "001",
    valorAtualizado: 1840.75,
    diasAtraso: 128,
    agrupamento: "RCHLO",
  },
  {
    idcon: "DEMO-BEMOL-001",
    idServ: "1",
    contrato: "BEMOL-DEMO-001",
    descricao: "Crediario loja",
    nomeFantasia: "Bemol",
    numeroTitulo: "002",
    valorAtualizado: 980.4,
    diasAtraso: 74,
    agrupamento: "BEMOL",
  },
  {
    idcon: "DEMO-GMATEUS-001",
    idServ: "1",
    contrato: "GMATEUS-DEMO-001",
    descricao: "Compra supermercado",
    nomeFantasia: "Grupo Mateus",
    numeroTitulo: "003",
    valorAtualizado: 620.2,
    diasAtraso: 39,
    agrupamento: "GMATEUS",
  },
];

function isDemoRequest(payload = {}) {
  return config.demoMode || onlyDigits(payload.telefone) === onlyDigits(DEMO_PHONE);
}

function getWallet(payload = {}) {
  return String(payload.carteira || "BEMOL").trim().toUpperCase();
}

function getContractsByWallet(payload = {}) {
  const carteira = getWallet(payload);
  const matches = demoContracts.filter((contract) => contract.agrupamento === carteira);
  return matches.length ? matches : demoContracts;
}

function getSelectedContract(payload = {}) {
  const contracts = getContractsByWallet(payload);
  const idcon = String(payload.idcon || "").trim();
  return contracts.find((contract) => contract.idcon === idcon) || contracts[0];
}

function getBaseDebt(payload = {}) {
  const contracts = getContractsByWallet(payload);
  const selected = getSelectedContract(payload);

  return {
    cpf: "00000000000",
    NomeCliente: "Cliente Demonstracao",
    PrimeiroNome: "Cliente",
    IdCon: selected.idcon,
    IdServ: selected.idServ,
    Contrato: selected.contrato,
    ContratoSelecionado: selected.contrato,
    ProdutoDescricao: selected.descricao,
    NomeFantasia: selected.nomeFantasia,
    ValorAtualizado: selected.valorAtualizado,
    DiasAtraso: selected.diasAtraso,
    Agrupamento: getWallet(payload),
    ContratosIdcon: contracts,
  };
}

function buildOption({ parcelas, total, dataPagamento }) {
  const entrada = parcelas <= 1 ? total : Math.max(50, Math.round(total * 0.25 * 100) / 100);
  const parcela = parcelas <= 1 ? 0 : Math.round(((total - entrada) / (parcelas - 1)) * 100) / 100;
  const label =
    parcelas <= 1
      ? `A vista por ${formatCurrencyBR(total)}`
      : `Entrada de ${formatCurrencyBR(entrada)} + ${parcelas - 1}x de ${formatCurrencyBR(parcela)}`;

  return {
    parcelas,
    entrada,
    parcela,
    total,
    dataEntrada: dataPagamento,
    dataPrimeiraParcela: dataPagamento,
    label,
  };
}

function getPaymentDate(payload = {}) {
  if (payload.dataPagamento) {
    const parts = String(payload.dataPagamento).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return String(payload.dataPagamento);
  }

  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

function recalcularMensagemDemo(payload = {}) {
  const debt = getBaseDebt(payload);
  const selected = getSelectedContract(payload);
  const dataPagamento = getPaymentDate(payload);
  const totalComDesconto = Math.round(selected.valorAtualizado * 0.72 * 100) / 100;
  const customInstallment = Number(payload.parcelaPersonalizada || 0);
  const parcelasList = customInstallment > 1 ? [customInstallment] : [1, 3, 6];
  const options = parcelasList.map((parcelas) =>
    buildOption({
      parcelas,
      total: totalComDesconto,
      dataPagamento,
    }),
  );
  const linhas = options.map((option, index) => `${index + 1}) ${option.label}`);

  return {
    ...debt,
    totalOpcoes: options.length,
    opcoes_zap: options.map((option, index) => ({
      id: `opt_${index + 1}`,
      label: option.label,
    })),
    mensagem_zap: linhas.join("\n"),
    mensagens_zap: linhas,
    mensagens_zap_por_opcao: [
      { id: "opt_header_recalc", numero: null, texto: `${debt.PrimeiroNome}, encontrei estas opcoes de negociacao:` },
      ...linhas.map((texto, index) => ({ id: `opt_${index + 1}`, numero: index + 1, texto })),
      { id: "opt_cta", numero: null, texto: "Qual opcao fica melhor para seguirmos?" },
    ],
    mensagem_zap_unica: [
      `${debt.PrimeiroNome}, encontrei estas opcoes de negociacao para o contrato ${selected.contrato}:`,
      "",
      ...linhas,
      "",
      "Qual opcao fica melhor para seguirmos?",
    ].join("\n"),
    payload_by_id: options.reduce((accumulator, option, index) => {
      accumulator[`opt_${index + 1}`] = option;
      return accumulator;
    }, {}),
    linhas_texto: [
      "Encontrei estas opcoes de negociacao:",
      ...linhas,
      "Responda com o numero da opcao desejada.",
    ],
    opcoes_compact: linhas.join(" | "),
    debug: {
      demo: true,
      fonte: "Dados ficticios para portfolio",
    },
  };
}

function listarIdconsDemo(payload = {}) {
  return getBaseDebt(payload);
}

function sugerirContraPropostaDemo(payload = {}) {
  const debt = getBaseDebt({
    ...payload,
    carteira: "RCHLO",
  });
  const valorAtualizado = Number(debt.ValorAtualizado || 0);
  const valorSugerido = Math.round(valorAtualizado * 0.38 * 100) / 100;

  return {
    ...debt,
    idCarteira: 6,
    faixaAtraso: "RIACHUELO - 121 A 150",
    produto: debt.ProdutoDescricao,
    produtoNormalizado: "PL",
    valorAtualizado,
    valorAtualizadoFormatado: formatCurrencyBR(valorAtualizado),
    percentualMedio: 0.38,
    percentualMedioFormatado: "38.00%",
    valorSugerido,
    valorSugeridoFormatado: formatCurrencyBR(valorSugerido),
    sampleSize: 24,
    usedFallback: false,
    fallbackReason: "",
    refreshedAt: new Date().toISOString(),
    matchStrategy: "demo_historico",
    produtoHistorico: "Cartao private label",
    produtoHistoricoNormalizado: "PL",
    faixaHistorica: "RIACHUELO - 121 A 150",
    TipoSugestao: "historico_demo",
  };
}

module.exports = {
  isDemoRequest,
  listarIdconsDemo,
  recalcularMensagemDemo,
  sugerirContraPropostaDemo,
};
