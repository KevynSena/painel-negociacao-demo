const API = {
  listar: "/api/listar-idcons",
  recalcular: "/api/recalcular",
  sugerirContraProposta: "/api/sugerir-contraproposta",
  scriptsCustom: "/api/scripts/custom",
};

const CARTEIRA_LABELS = {
  RCHLO: "Riachuelo",
  BEMOL: "Bemol",
  GMATEUS: "Grupo Mateus",
  TOPFAMA: "Topfama",
  SUPERDB: "Supermercados DB",
};

const MANUAL_DISCOUNT_WALLETS = new Set([]);
const INSTALLMENT_TOOL_LIMITS = {
  SUPERDB: 17,
  GMATEUS: 23,
};
const NEGOTIATION_MODE_CONFIG = {
  RCHLO: {
    label: "Tipo de negociação",
    defaultValue: "1",
    options: [
      { value: "1", label: "Parcelar fatura" },
      { value: "2", label: "Débito total" },
    ],
  },
  BEMOL: {
    label: "Modo de cálculo",
    defaultValue: "1",
    options: [
      { value: "1", label: "Calcular contrato por vez" },
      { value: "3", label: "Calcular todos os contratos juntos" },
    ],
  },
};
const SCRIPT_LIBRARY = window.APP_SCRIPT_LIBRARY || { DEFAULT: [] };
const CARTEIRA_SUPPORT_CHANNELS = {
  BEMOL: "Lojas Bemol e canais oficiais indicados no carnê ou boleto",
  RCHLO: "Central Midway: 0800 727 4417 ou (11) 3004-5417",
  GMATEUS: "Central Grupo Mateus: 0800 000 3849 ou loja física",
  TOPFAMA: "loja Topfama ou central indicada no boleto",
  SUPERDB: "Supermercados DB: (92) 4003-6451 ou loja física",
};

const elements = {
  form: document.getElementById("formNegociacao"),
  telefone: document.getElementById("telefone"),
  carteira: document.getElementById("carteira"),
  tipoNegociacao: document.getElementById("tipoNegociacao"),
  tipoNegociacaoField: document.getElementById("tipoNegociacao")?.closest(".field"),
  tipoNegociacaoLabel:
    document.getElementById("tipoNegociacao")?.closest(".field")?.querySelector("span"),
  dataPagamento: document.getElementById("dataPagamento"),
  descontoManual: document.getElementById("descontoManual"),
  valorEntrada: document.getElementById("valorEntrada"),
  parcelaPersonalizada: document.getElementById("parcelaPersonalizada"),
  installmentRangeLabel: document.getElementById("installmentRangeLabel"),
  idconSelect: document.getElementById("idconSelect"),
  btnBuscarDividas: document.getElementById("btnBuscarDividas"),
  btnCalcular: document.getElementById("btnCalcular"),
  btnCalcularParcela: document.getElementById("btnCalcularParcela"),
  btnCalcularLabel: document.getElementById("btnCalcularLabel"),
  btnSugerirContra: document.getElementById("btnSugerirContra"),
  btnSugerirContraTab: document.getElementById("btnSugerirContraTab"),
  tabContraProposta: document.getElementById("tabContraProposta"),
  btnCopiar: document.getElementById("btnCopiar"),
  btnLimpar: document.getElementById("btnLimpar"),
  mensagemZap: document.getElementById("mensagemZap"),
  alertForm: document.getElementById("alertForm"),
  alertOutput: document.getElementById("alertOutput"),
  statusText: document.getElementById("statusText"),
  liveStatus: document.getElementById("liveStatus"),
  clienteChip: document.getElementById("clienteChip"),
  contractsRail: document.getElementById("contractsRail"),
  contractsCount: document.getElementById("contractsCount"),
  selectedContractText: document.getElementById("selectedContractText"),
  summaryStatus: document.getElementById("summaryStatus"),
  messageMode: document.getElementById("messageMode"),
  metricBusca: document.getElementById("metricBusca"),
  metricCliente: document.getElementById("metricCliente"),
  metricCarteira: document.getElementById("metricCarteira"),
  metricMensagem: document.getElementById("metricMensagem"),
  metricOpcoes: document.getElementById("metricOpcoes"),
  counterSuggestionCard: document.getElementById("counterSuggestionCard"),
  counterSuggestionValue: document.getElementById("counterSuggestionValue"),
  counterSuggestionMode: document.getElementById("counterSuggestionMode"),
  counterSuggestionText: document.getElementById("counterSuggestionText"),
  counterSuggestionMeta: document.getElementById("counterSuggestionMeta"),
  counterSuggestionCardTab: document.getElementById("counterSuggestionCardTab"),
  counterSuggestionValueTab: document.getElementById("counterSuggestionValueTab"),
  counterSuggestionModeTab: document.getElementById("counterSuggestionModeTab"),
  counterSuggestionTextTab: document.getElementById("counterSuggestionTextTab"),
  counterSuggestionMetaTab: document.getElementById("counterSuggestionMetaTab"),
  manualDiscountField: document.getElementById("manualDiscountField"),
  superdbInstallmentTools: document.getElementById("superdbInstallmentTools"),
  tabTriggers: Array.from(document.querySelectorAll("[data-tab-trigger]")),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  scriptSearch: document.getElementById("scriptSearch"),
  scriptFilters: document.getElementById("scriptFilters"),
  scriptThemesSummary: document.getElementById("scriptThemesSummary"),
  scriptsGrid: document.getElementById("scriptsGrid"),
  scriptsCounter: document.getElementById("scriptsCounter"),
  scriptsWalletBadge: document.getElementById("scriptsWalletBadge"),
  btnAdicionarScript: document.getElementById("btnAdicionarScript"),
  crmWalletBadge: document.getElementById("crmWalletBadge"),
  crmClientName: document.getElementById("crmClientName"),
  crmClientPhone: document.getElementById("crmClientPhone"),
  crmClientDocument: document.getElementById("crmClientDocument"),
  crmWorkflowStatus: document.getElementById("crmWorkflowStatus"),
  crmLastInteraction: document.getElementById("crmLastInteraction"),
  crmPromiseStatus: document.getElementById("crmPromiseStatus"),
  crmContractTitle: document.getElementById("crmContractTitle"),
  crmContractDescription: document.getElementById("crmContractDescription"),
  crmContractAmount: document.getElementById("crmContractAmount"),
  crmContractDelay: document.getElementById("crmContractDelay"),
  crmContractCount: document.getElementById("crmContractCount"),
  crmNextAction: document.getElementById("crmNextAction"),
  crmHistoryList: document.getElementById("crmHistoryList"),
  conversationClientName: document.getElementById("conversationClientName"),
  conversationClientMeta: document.getElementById("conversationClientMeta"),
  conversationStatusBadge: document.getElementById("conversationStatusBadge"),
  conversationContractBadge: document.getElementById("conversationContractBadge"),
  conversationActionHint: document.getElementById("conversationActionHint"),
  copyHelper: document.getElementById("copyHelper"),
  copyHelperTitle: document.getElementById("copyHelperTitle"),
  copyHelperDescription: document.getElementById("copyHelperDescription"),
  copyHelperTextarea: document.getElementById("copyHelperTextarea"),
  btnEditarHelper: document.getElementById("btnEditarHelper"),
  btnCopiarHelper: document.getElementById("btnCopiarHelper"),
  btnFecharCopyHelper: document.getElementById("btnFecharCopyHelper"),
  btnSalvarScriptHelper: document.getElementById("btnSalvarScriptHelper"),
  scriptEditorFields: document.getElementById("scriptEditorFields"),
  scriptTitleInput: document.getElementById("scriptTitleInput"),
  scriptCategoryInput: document.getElementById("scriptCategoryInput"),
};

const state = {
  contratos: [],
  clienteNome: "",
  primeiroNome: "",
  mensagem: "",
  scriptSearch: "",
  scriptFilter: "Todos",
  activeTab: "mensagem",
  scriptDialogEditable: false,
  scriptDialogMode: "preview",
  scriptDialogScript: null,
  scriptDialogWallet: "DEFAULT",
  customScriptLibrary: {},
  counterSuggestion: null,
  loadedTelefone: "",
  loadedCarteira: "",
  documento: "",
  workflowStatus: "Não iniciado",
  lastInteractionLabel: "",
  activityLog: [],
};

function showNotice(element, type, message) {
  element.className = `notice ${type} show`;
  element.textContent = message;
}

function clearNotice(element) {
  element.className = "notice";
  element.textContent = "";
}

function setStatus(mode, message) {
  elements.liveStatus.dataset.state = mode;
  elements.statusText.textContent = message;
  elements.summaryStatus.textContent = message;
  renderCrmSnapshot();
}

function setWorkflowStatus(status) {
  state.workflowStatus = String(status || "").trim() || "Não iniciado";
  renderCrmSnapshot();
}

function formatPhoneDisplay(value) {
  const digits = digitsOnly(value);

  if (!digits) return "—";
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

function formatDocumentDisplay(value) {
  const digits = digitsOnly(value);

  if (!digits) return "—";
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return digits;
}

function buildSessionTimestamp(date = new Date()) {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentContractSnapshot() {
  if (shouldAggregateBemolContracts() && state.contratos.length > 0) {
    return {
      title: "Todos os contratos da Bemol",
      description: `${state.contratos.length} contrato(s) prontos para cálculo conjunto.`,
      amount: state.contratos.reduce(
        (total, contrato) => total + Number(contrato.valorAtualizado || 0),
        0
      ),
      delay: null,
      count: state.contratos.length,
      wallet: getCarteiraValue(),
    };
  }

  const selected = getSelectedContract() || state.contratos[0] || null;

  if (!selected) {
    return null;
  }

  return {
    title: selected.contrato || `IDCON ${selected.idcon}`,
    description: selected.descricao || "Contrato sem descrição detalhada.",
    amount: Number(selected.valorAtualizado || 0),
    delay: selected.diasAtraso || null,
    count: state.contratos.length,
    wallet: selected.agrupamento || getCarteiraValue(),
  };
}

function getNextActionHint() {
  if (!digitsOnly(elements.telefone?.value || "")) {
    return "Informe o telefone do cliente para abrir o contexto da operação.";
  }

  if (!getCarteiraValue()) {
    return "Selecione a carteira para habilitar o fluxo de busca e cálculo.";
  }

  if (!state.contratos.length) {
    return "Clique em Buscar dívidas para carregar contratos, atraso e valores do cliente.";
  }

  if (!state.mensagem) {
    return shouldAggregateBemolContracts()
      ? "Consolide os contratos da Bemol ou gere a proposta para iniciar a conversa."
      : "Selecione o contrato foco e clique em Recalcular mensagem para montar a abordagem.";
  }

  return "Revise a mensagem, copie o texto e avance o atendimento com a resposta ao cliente.";
}

function renderSessionHistory() {
  if (!elements.crmHistoryList) return;

  if (!Array.isArray(state.activityLog) || state.activityLog.length === 0) {
    elements.crmHistoryList.innerHTML =
      '<div class="empty-state">Nenhum evento registrado nesta sessão ainda.</div>';
    return;
  }

  elements.crmHistoryList.innerHTML = state.activityLog
    .map(
      (event) => `
        <article class="crm-history-item">
          <strong>${event.title}</strong>
          ${event.description ? `<p>${event.description}</p>` : ""}
          <span class="crm-history-time">${event.timestamp}</span>
        </article>
      `
    )
    .join("");
}

function normalizeWorkflowToken(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function renderConversationSnapshot(contract, walletLabel) {
  if (!elements.conversationClientName) return;

  const phone = formatPhoneDisplay(elements.telefone?.value || state.loadedTelefone);
  const clientName = state.clienteNome || "Nenhum cliente em atendimento";
  const workflowLabel = state.workflowStatus || "Não iniciado";
  const workflowToken = normalizeWorkflowToken(workflowLabel);
  const contractLabel = contract?.title || "Sem contrato foco";
  const metaParts = [];

  if (digitsOnly(elements.telefone?.value || state.loadedTelefone)) {
    metaParts.push(phone);
  }
  if (getCarteiraValue()) {
    metaParts.push(walletLabel);
  }
  if (state.contratos.length) {
    metaParts.push(`${state.contratos.length} contrato(s) carregado(s)`);
  }

  elements.conversationClientName.textContent = clientName;
  elements.conversationClientMeta.textContent =
    metaParts.join(" | ") ||
    "Busque um cliente para abrir o contexto da conversa e do contrato foco.";
  elements.conversationStatusBadge.textContent = workflowLabel;
  elements.conversationStatusBadge.dataset.workflow = workflowToken;
  elements.conversationContractBadge.textContent = contractLabel;
  elements.conversationActionHint.textContent = getNextActionHint();
}

function renderCrmSnapshot() {
  if (!elements.crmClientName) return;

  const contract = getCurrentContractSnapshot();
  const walletLabel = contract?.wallet
    ? getCarteiraLabel(contract.wallet)
    : getCarteiraLabel(getCarteiraValue());

  elements.crmWalletBadge.textContent =
    walletLabel && walletLabel !== "Não definida"
      ? walletLabel
      : "Carteira não definida";
  elements.crmClientName.textContent = state.clienteNome || "Nenhum cliente carregado";
  elements.crmClientPhone.textContent = formatPhoneDisplay(
    elements.telefone?.value || state.loadedTelefone
  );
  elements.crmClientDocument.textContent = formatDocumentDisplay(state.documento);
  elements.crmWorkflowStatus.textContent = state.workflowStatus || "Não iniciado";
  elements.crmLastInteraction.textContent =
    state.lastInteractionLabel || "Ainda sem interação";
  elements.crmPromiseStatus.textContent = "Não registrada";
  elements.crmContractTitle.textContent =
    contract?.title || "Nenhum contrato selecionado";
  elements.crmContractDescription.textContent =
    contract?.description ||
    "Busque as dívidas para carregar os contratos vinculados e iniciar a negociação.";
  elements.crmContractAmount.textContent =
    contract && Number.isFinite(contract.amount)
      ? formatCurrency(contract.amount)
      : "—";
  elements.crmContractDelay.textContent = contract?.delay
    ? `${contract.delay} dias`
    : "—";
  elements.crmContractCount.textContent = state.contratos.length
    ? `${state.contratos.length} contrato(s)`
    : "Nenhum";
  elements.crmNextAction.textContent = getNextActionHint();

  renderConversationSnapshot(contract, walletLabel);
  renderSessionHistory();
}

function registerActivityEvent(title, description = "") {
  const timestamp = buildSessionTimestamp();
  state.lastInteractionLabel = timestamp;
  state.activityLog = [
    {
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      timestamp,
    },
    ...state.activityLog,
  ].slice(0, 8);
  renderCrmSnapshot();
}

function getCarteiraLabel(value) {
  return CARTEIRA_LABELS[String(value || "").trim().toUpperCase()] || "Não definida";
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function sanitizeValorEntrada(value) {
  if (!value) return "";

  let normalized = String(value).trim();

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  return normalized;
}

function sanitizeNumericInput(value) {
  if (value == null) return "";

  let normalized = String(value).trim();

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  return normalized;
}

function sanitizeInstallmentInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  const parsed = Number.parseInt(digits, 10);
  return Number.isInteger(parsed) ? String(parsed) : "";
}

function formatDateToBr(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return value;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function getCarteiraValue() {
  return String(elements.carteira.value || "").trim().toUpperCase();
}

function getNegotiationModeConfig(carteira = getCarteiraValue()) {
  return NEGOTIATION_MODE_CONFIG[String(carteira || "").trim().toUpperCase()] || null;
}

function shouldShowTipoNegociacaoField(carteira = getCarteiraValue()) {
  return Boolean(getNegotiationModeConfig(carteira));
}

function shouldAggregateBemolContracts() {
  return getCarteiraValue() === "BEMOL" && String(elements.tipoNegociacao.value || "") === "3";
}

function syncTipoNegociacaoOptions(carteira = getCarteiraValue()) {
  const config = getNegotiationModeConfig(carteira);
  const currentValue = String(elements.tipoNegociacao.value || "");
  const hiddenWalletDefaultMode =
    carteira === "TOPFAMA" ? "1" : getInstallmentToolLimit() > 0 ? "1" : "2";

  if (!config) {
    if (elements.tipoNegociacaoLabel) {
      elements.tipoNegociacaoLabel.textContent = "Tipo de negociação";
    }
    elements.tipoNegociacao.innerHTML = `
      <option value="1">Parcelar fatura</option>
      <option value="2">Débito total</option>
    `;
    elements.tipoNegociacao.value = hiddenWalletDefaultMode;
    return;
  }

  if (elements.tipoNegociacaoLabel) {
    elements.tipoNegociacaoLabel.textContent = config.label;
  }

  elements.tipoNegociacao.innerHTML = config.options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");

  elements.tipoNegociacao.value = config.options.some(
    (option) => option.value === currentValue
  )
    ? currentValue
    : config.defaultValue;
}

function hasLoadedNegotiationContext() {
  return Boolean(
    state.loadedTelefone ||
      state.loadedCarteira ||
      state.contratos.length ||
      state.clienteNome ||
      state.mensagem ||
      state.counterSuggestion
  );
}

function rememberLoadedContext() {
  state.loadedTelefone = digitsOnly(elements.telefone.value);
  state.loadedCarteira = getCarteiraValue();
}

function resetLoadedContext() {
  state.loadedTelefone = "";
  state.loadedCarteira = "";
}

function getInstallmentToolLimit() {
  const carteira = getCarteiraValue();
  return INSTALLMENT_TOOL_LIMITS[carteira] || 0;
}

function shouldShowInstallmentTools() {
  return getInstallmentToolLimit() > 0 && Number(elements.tipoNegociacao.value || 1) === 1;
}

function getSelectedContract() {
  if (shouldAggregateBemolContracts()) {
    return null;
  }
  const selectedIdcon = String(elements.idconSelect.value || "");
  return (
    state.contratos.find((contrato) => String(contrato.idcon) === selectedIdcon) || null
  );
}

function getPrimeiroNome(nome, fallback = "") {
  const nomeNormalizado = String(nome || "").trim();
  if (fallback) return String(fallback).trim();
  if (!nomeNormalizado) return "";
  return nomeNormalizado.split(/\s+/)[0] || "";
}

function normalizeContractEntry(entry) {
  if (!entry) return null;

  const idcon = String(entry.idcon ?? entry.IdCon ?? "").trim();
  const contrato = String(
    entry.contrato ?? entry.Contrato ?? entry.ContratoSelecionado ?? ""
  ).trim();
  const descricao = String(
    entry.descricao ?? entry.ProdutoDescricao ?? entry.Descricao ?? ""
  ).trim();
  const nomeFantasia = String(
    entry.nomeFantasia ?? entry.NomeFantasia ?? ""
  ).trim();
  const numeroTitulo = String(entry.numeroTitulo ?? entry.NumeroTitulo ?? "").trim();
  const valorAtualizado = Number(
    entry.valorAtualizado ?? entry.ValorAtualizado ?? 0
  );
  const diasAtraso = Number(entry.diasAtraso ?? entry.DiasAtraso ?? 0);
  const agrupamento = String(
    entry.agrupamento ?? entry.Agrupamento ?? getCarteiraValue()
  )
    .trim()
    .toUpperCase();

  if (
    !idcon &&
    !contrato &&
    !descricao &&
    !nomeFantasia &&
    !numeroTitulo &&
    !valorAtualizado &&
    !diasAtraso
  ) {
    return null;
  }

  return {
    idcon,
    contrato,
    descricao,
    nomeFantasia,
    numeroTitulo,
    valorAtualizado,
    diasAtraso,
    agrupamento,
    selecionado: true,
  };
}

function syncUiWithDebtResult(result, { replaceContracts = false } = {}) {
  state.documento = String(
    result?.cpf || result?.CPF || result?.Cpf || state.documento || ""
  ).trim();

  const incomingContracts = Array.isArray(result?.ContratosIdcon)
    ? result.ContratosIdcon.map(normalizeContractEntry).filter(Boolean)
    : [];
  const fallbackContract = normalizeContractEntry(result);
  let nextContracts = replaceContracts ? incomingContracts : [...state.contratos];

  if (incomingContracts.length > 0) {
    nextContracts = incomingContracts;
  }

  if (fallbackContract) {
    if (!nextContracts.length) {
      nextContracts = [fallbackContract];
    } else {
      const contractKey = String(
        fallbackContract.idcon || fallbackContract.contrato || ""
      );
      const existingIndex = nextContracts.findIndex((item) => {
        const itemKey = String(item.idcon || item.contrato || "");
        return itemKey && contractKey && itemKey === contractKey;
      });

      if (existingIndex >= 0) {
        nextContracts[existingIndex] = {
          ...nextContracts[existingIndex],
          ...fallbackContract,
        };
      } else {
        nextContracts = [fallbackContract, ...nextContracts];
      }
    }
  }

  state.contratos = nextContracts;
  renderContratos(String(result?.IdCon || fallbackContract?.idcon || ""));

  const nomeCliente = String(
    result?.NomeCliente || result?.nome || state.clienteNome || ""
  ).trim();
  updateCliente(
    nomeCliente,
    getPrimeiroNome(nomeCliente, result?.PrimeiroNome || state.primeiroNome)
  );
  renderCrmSnapshot();
}

function getActiveScriptWalletKey() {
  return getCarteiraValue() || "DEFAULT";
}

function getCustomScriptsForWallet(wallet) {
  return Array.isArray(state.customScriptLibrary?.[wallet])
    ? state.customScriptLibrary[wallet]
    : [];
}

function mergeScriptLibraries(...libraries) {
  const byId = new Map();

  libraries.flat().forEach((script) => {
    if (!script) return;
    const id = String(script.id || script.titulo || "").trim();
    if (!id) return;
    byId.set(id, {
      ...script,
      id,
    });
  });

  return Array.from(byId.values());
}

function getActiveScriptLibrary() {
  const carteira = getCarteiraValue();
  const wallet = getActiveScriptWalletKey();
  const hasSpecificLibrary = Boolean(carteira && SCRIPT_LIBRARY[carteira]);
  const baseLibrary = hasSpecificLibrary
    ? SCRIPT_LIBRARY[carteira]
    : SCRIPT_LIBRARY.DEFAULT || [];
  const sharedCustomScripts = hasSpecificLibrary || wallet === "DEFAULT"
    ? []
    : getCustomScriptsForWallet("DEFAULT");

  return mergeScriptLibraries(
    baseLibrary,
    sharedCustomScripts,
    getCustomScriptsForWallet(wallet)
  );
}

function getActiveScriptLibraryLabel() {
  const carteira = getCarteiraValue();
  if (!carteira) {
    return "Biblioteca geral";
  }

  return `Scripts de ${getCarteiraLabel(carteira)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeSearchValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isOpeningScript(script) {
  return normalizeSearchValue(script?.categoria) === "abertura";
}

function isPaymentClaimScript(script) {
  return normalizeSearchValue(script?.titulo).includes("alega pagamento");
}

function isOutOfPortfolioScript(script) {
  return normalizeSearchValue(script?.titulo).includes("fora de assessoria");
}

function isStandardScriptTopic(script) {
  return isOpeningScript(script) || isPaymentClaimScript(script) || isOutOfPortfolioScript(script);
}

function shouldUseStandardScriptText(script) {
  return isStandardScriptTopic(script) && !script?.custom;
}

function getWalletScriptLabel() {
  const carteira = getCarteiraValue();
  return CARTEIRA_LABELS[carteira] || "carteira";
}

function getStandardOpeningText() {
  const carteira = getCarteiraValue();

  const openingMessages = {
    BEMOL:
      "Ola. Aqui e a equipe da Syscob no atendimento da Bemol. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora.",
    RCHLO:
      "Ola. Aqui e a equipe da Syscob no atendimento da Riachuelo. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora.",
    GMATEUS:
      "Ola. Aqui e a equipe da Syscob no atendimento do Grupo Mateus. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora.",
    TOPFAMA:
      "Ola. Aqui e a equipe da Syscob no atendimento da Topfama. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora.",
    SUPERDB:
      "Ola. Aqui e a equipe da Syscob no atendimento do Supermercados DB. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora.",
  };

  return (
    openingMessages[carteira] ||
    "Ola. Aqui e a equipe da Syscob. Estou por aqui para te ajudar com a regularizacao e posso te apresentar as condicoes disponiveis neste momento. Se quiser, sigo com os detalhes agora."
  );
}

function getStandardOutOfPortfolioText() {
  const carteira = getCarteiraValue();
  const carteiraLabel = getWalletScriptLabel();
  const canal = CARTEIRA_SUPPORT_CHANNELS[carteira] || "canal oficial da carteira";

  if (!CARTEIRA_SUPPORT_CHANNELS[carteira]) {
    return "Ola. No momento este contrato nao esta sob atendimento da nossa assessoria. Para continuidade, peco que voce siga diretamente pelo canal oficial da carteira. Se quiser, eu ainda posso te orientar sobre o proximo passo.";
  }

  return `Ola. No momento este contrato nao esta sob atendimento da nossa assessoria. Para continuidade, peco que voce siga diretamente pelo canal oficial de ${carteiraLabel}: ${canal}. Se quiser, eu ainda posso te orientar sobre o proximo passo.`;
}

function getStandardPaymentClaimText() {
  return "Perfeito. Obrigado por me avisar. Para validar com seguranca, me envie por favor o comprovante com data, valor e identificacao da transacao. Assim que eu receber, sigo com a conferencia do atendimento.";
}

function getStandardScriptText(script) {
  if (isOpeningScript(script)) {
    return getStandardOpeningText();
  }

  if (isPaymentClaimScript(script)) {
    return getStandardPaymentClaimText();
  }

  if (isOutOfPortfolioScript(script)) {
    return getStandardOutOfPortfolioText();
  }

  return script?.texto || script?.text || "";
}

function cleanupTemplateText(text) {
  let output = String(text || "");

  output = output
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/(^|\n)\s*,\s*/g, "$1")
    .replace(/,\s*(?=[.!?])/g, "")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (/^[a-zà-ÿ]/u.test(output)) {
    output = output.charAt(0).toUpperCase() + output.slice(1);
  }

  return output;
}

function formatTemplatePlaceholder(label) {
  return `{${label}}`;
}

function toCategorySlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getScriptDescription(script) {
  const category = toCategorySlug(script?.categoria);

  const descriptions = {
    abertura: "Mensagem de abertura para iniciar o atendimento com contexto claro.",
    fluxo: "Texto operacional para triagem, confirmação ou encaminhamento.",
    negociacao: "Modelo focado em conduzir proposta, valor e próximo passo.",
    objecao: "Argumento pronto para contornar travas durante a conversa.",
    "acompanhamento": "Mensagem para retomada, confirmação ou lembrete do acordo.",
    contestacao: "Resposta pronta para comprovante, divergência ou questionamento.",
    encerramento: "Fechamento do atendimento com orientação objetiva ao cliente.",
  };

  return (
    descriptions[category] ||
    "Texto pronto para o operador adaptar ao contexto do atendimento."
  );
}

function getScriptsByCategory() {
  const activeLibrary = getActiveScriptLibrary();
  return activeLibrary.filter((script) => {
    const categoria = script?.categoria || "Geral";
    return state.scriptFilter === "Todos" || categoria === state.scriptFilter;
  });
}

function getScriptSearchText(script) {
  const sourceText = shouldUseStandardScriptText(script)
    ? getStandardScriptText(script)
    : script?.texto || script?.text || "";

  return normalizeSearchValue(
    [script?.titulo, script?.categoria, getScriptDescription(script), sourceText].join(" ")
  );
}

function getFilteredScripts() {
  const scripts = getScriptsByCategory();
  const searchTerm = normalizeSearchValue(state.scriptSearch);

  if (!searchTerm) {
    return scripts;
  }

  return scripts.filter((script) => getScriptSearchText(script).includes(searchTerm));
}

function getScriptThemes() {
  const uniqueThemes = new Map();

  getScriptsByCategory().forEach((script) => {
    const title = String(script?.titulo || "").trim();
    if (!title) return;
    const themeKey = normalizeSearchValue(title);
    if (!themeKey || uniqueThemes.has(themeKey)) return;
    uniqueThemes.set(themeKey, title);
  });

  return Array.from(uniqueThemes.values());
}

function renderScriptThemesSummary() {
  if (!elements.scriptThemesSummary) return;

  const themes = getScriptThemes();
  const activeSearch = normalizeSearchValue(state.scriptSearch);

  elements.scriptThemesSummary.innerHTML = "";

  if (!themes.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  themes.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "script-theme-chip";
    button.textContent = theme;
    button.classList.toggle("is-active", normalizeSearchValue(theme) === activeSearch);
    button.addEventListener("click", () => {
      const nextSearch = normalizeSearchValue(theme) === activeSearch ? "" : theme;
      state.scriptSearch = nextSearch;
      if (elements.scriptSearch) {
        elements.scriptSearch.value = nextSearch;
      }
      renderScriptThemesSummary();
      renderScripts();
    });
    fragment.appendChild(button);
  });

  elements.scriptThemesSummary.appendChild(fragment);
}

function resetScriptNavigation() {
  state.scriptFilter = "Todos";
  state.scriptSearch = "";
  if (elements.scriptSearch) {
    elements.scriptSearch.value = "";
  }
}

function applyTemplate(text) {
  const selectedContract = getSelectedContract();
  const primeiroNome =
    state.primeiroNome || (state.clienteNome ? state.clienteNome.trim().split(/\s+/)[0] : "");
  const cliente = state.clienteNome || "";
  const carteiraKey = getCarteiraValue();
  const carteira = getCarteiraLabel(carteiraKey);
  const contrato =
    selectedContract?.contrato ||
    (elements.selectedContractText.textContent !== "Nenhum"
      ? elements.selectedContractText.textContent
      : "");
  const idcon = selectedContract?.idcon || elements.idconSelect.value || "";
  const dataPagamento = formatDateToBr(elements.dataPagamento.value);
  const valorEntradaInformado = sanitizeValorEntrada(elements.valorEntrada.value);
  const valorEntradaNumero = Number.parseFloat(valorEntradaInformado);
  const valorEntrada =
    valorEntradaInformado && Number.isFinite(valorEntradaNumero)
      ? formatCurrency(valorEntradaNumero)
      : "";
  const canalOficial = CARTEIRA_SUPPORT_CHANNELS[carteiraKey] || "";

  return cleanupTemplateText(
    String(text || "")
      .replaceAll("{{primeiro_nome}}", primeiroNome || formatTemplatePlaceholder("primeiro nome"))
      .replaceAll("{{nome_cliente}}", cliente || formatTemplatePlaceholder("nome do cliente"))
      .replaceAll(
        "{{carteira}}",
        carteira !== "Não definida" ? carteira : formatTemplatePlaceholder("carteira")
      )
      .replaceAll("{{contrato}}", contrato || formatTemplatePlaceholder("contrato"))
      .replaceAll("{{idcon}}", idcon || formatTemplatePlaceholder("idcon"))
      .replaceAll("{{data_pagamento}}", dataPagamento || formatTemplatePlaceholder("data"))
      .replaceAll("{{valor_entrada}}", valorEntrada || formatTemplatePlaceholder("entrada"))
      .replaceAll(
        "{{canal_oficial}}",
        canalOficial || formatTemplatePlaceholder("canal oficial")
      )
  );
}

function activateTab(tabName) {
  state.activeTab = tabName;

  elements.tabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.tabTrigger === tabName;
    trigger.classList.toggle("is-active", isActive);
    trigger.setAttribute("aria-selected", String(isActive));
  });

  elements.tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  elements.btnCopiar.style.display = tabName === "mensagem" ? "inline-flex" : "none";

  if (tabName === "scripts") {
    renderScriptFilters();
    renderScripts();
  }
}

function setMensagem(text) {
  state.mensagem = text || "";

  if (state.mensagem) {
    elements.mensagemZap.classList.remove("placeholder");
    elements.mensagemZap.textContent = state.mensagem;
    elements.btnCopiar.disabled = false;
    elements.messageMode.textContent = "Mensagem pronta";
    elements.metricMensagem.textContent = "Pronta";
    renderCrmSnapshot();
    return;
  }

  elements.mensagemZap.classList.add("placeholder");
  elements.mensagemZap.textContent = "Aguardando cálculo...";
  elements.btnCopiar.disabled = true;
  elements.messageMode.textContent = "Aguardando cálculo";
  elements.metricMensagem.textContent = "Sem cálculo";
  renderCrmSnapshot();
}

function getBemolPayloadOptions(result) {
  return Object.values(result?.payload_by_id || {})
    .map((option) => ({
      ...option,
      parcelas: Number(option?.parcelas || 0),
      entrada: Number(option?.entrada || 0),
      parcela: Number(option?.parcela || 0),
      total: Number(option?.total || 0),
    }))
    .filter((option) => option.parcelas > 0)
    .sort((left, right) => left.parcelas - right.parcelas);
}

function pickBemolOptionByParcelCount(options, parcelas) {
  return (
    options.find((option) => Number(option.parcelas) === Number(parcelas)) || null
  );
}

function buildBemolAggregateMessage({
  contratos,
  parcelas,
  entradaTotal,
  parcelaTotal,
  totalGeral,
  dataPrimeiraParcela,
}) {
  const primeiroNome =
    state.primeiroNome ||
    (state.clienteNome ? state.clienteNome.trim().split(/\s+/)[0] : "");
  const saudacao = primeiroNome ? `${primeiroNome},` : "Tenho uma condiÃ§Ã£o para vocÃª:";
  const quantidadeContratos = contratos.length;
  const dataFormatada = formatDateToBr(dataPrimeiraParcela);
  const linhas = [
    `${saudacao} consolidamos ${quantidadeContratos} contrato(s) da Bemol em uma Ãºnica proposta:`,
    "",
  ];

  if (parcelas <= 1) {
    linhas.push(`- QuitaÃ§Ã£o Ã  vista: ${formatCurrency(totalGeral)}`);
  } else {
    linhas.push(`- Entrada total: ${formatCurrency(entradaTotal)}`);
    linhas.push(
      `- Parcelas mensais: ${Math.max(parcelas - 1, 0)}x de ${formatCurrency(
        parcelaTotal
      )}`
    );
  }

  linhas.push(`- Valor total consolidado: ${formatCurrency(totalGeral)}`);

  if (dataFormatada) {
    linhas.push(`- Primeiro vencimento: ${dataFormatada}`);
  }

  linhas.push("");
  linhas.push("Se fizer sentido para vocÃª, posso seguir com essa opÃ§Ã£o agora.");

  return linhas.join("\n");
}

async function runBemolAggregateCalculation(payload) {
  if (!Array.isArray(state.contratos) || state.contratos.length === 0) {
    throw new Error("Busque as dÃ­vidas antes de calcular todos os contratos da Bemol.");
  }

  const results = [];
  const errors = [];

  for (const contrato of state.contratos) {
    try {
      const result = await postJson(API.recalcular, {
        ...payload,
        idcon: contrato.idcon,
        tipoNegociacao: 1,
      });
      results.push(result);
    } catch (error) {
      errors.push(`IDCON ${contrato.idcon}: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `NÃ£o foi possÃ­vel calcular todos os contratos da Bemol. ${errors.join(" | ")}`
    );
  }

  const optionsByResult = results.map(getBemolPayloadOptions);
  const parcelCounts = optionsByResult.map((options) =>
    options.map((option) => option.parcelas)
  );
  const commonParcelCounts = parcelCounts.reduce((common, counts) => {
    const nextCounts = new Set(counts);
    return common.filter((count) => nextCounts.has(count));
  });
  const parcelas = commonParcelCounts.sort((left, right) => right - left)[0];

  if (!parcelas) {
    throw new Error(
      "A Bemol nÃ£o retornou uma quantidade de parcelas em comum entre os contratos."
    );
  }

  const selectedOptions = optionsByResult.map((options) =>
    pickBemolOptionByParcelCount(options, parcelas)
  );

  if (selectedOptions.some((option) => !option)) {
    throw new Error(
      "NÃ£o foi possÃ­vel consolidar a mesma quantidade de parcelas para todos os contratos."
    );
  }

  const entradaTotal = selectedOptions.reduce(
    (total, option) => total + Number(option.entrada || 0),
    0
  );
  const parcelaTotal = selectedOptions.reduce(
    (total, option) => total + Number(option.parcela || 0),
    0
  );
  const totalGeral = selectedOptions.reduce(
    (total, option) => total + Number(option.total || 0),
    0
  );
  const dataPrimeiraParcela =
    selectedOptions[0]?.dataPrimeiraParcela ||
    selectedOptions[0]?.dataEntrada ||
    payload.dataPagamento ||
    "";
  const firstResult = results[0] || {};

  updateCliente(
    firstResult.NomeCliente || state.clienteNome,
    firstResult.PrimeiroNome || state.primeiroNome
  );
  clearCounterSuggestion();
  setMensagem(
    buildBemolAggregateMessage({
      contratos: state.contratos,
      parcelas,
      entradaTotal,
      parcelaTotal,
      totalGeral,
      dataPrimeiraParcela,
    })
  );
  rememberLoadedContext();
  setWorkflowStatus("Em negociação");
  registerActivityEvent(
    "Proposta consolidada",
    `${state.contratos.length} contrato(s) agrupados em ${parcelas} parcela(s).`
  );
  showNotice(
    elements.alertOutput,
    "success",
    "Proposta consolidada da Bemol gerada com sucesso."
  );
  setStatus("ok", "ConsolidaÃ§Ã£o pronta");
}

function buildCounterProposalMessage(suggestion) {
  const primeiroNome =
    suggestion?.PrimeiroNome ||
    state.primeiroNome ||
    (state.clienteNome ? state.clienteNome.trim().split(/\s+/)[0] : "");
  const saudacao = primeiroNome ? `${primeiroNome},` : "Após análise do seu caso,";
  const contrato =
    suggestion?.Contrato ||
    getSelectedContract()?.contrato ||
    elements.selectedContractText.textContent;
  const contratoTrecho =
    contrato && contrato !== "Nenhum" ? ` do contrato ${contrato}` : "";
  const valorSugerido = suggestion?.valorSugeridoFormatado || formatCurrency(0);
  const dataPagamento = formatDateToBr(elements.dataPagamento.value);
  const confirmacaoPagamento = dataPagamento
    ? `Você confirma a certeza do pagamento para ${dataPagamento} para enviarmos à aprovação agora?`
    : "Você confirma a certeza do pagamento para enviarmos à aprovação agora?";

  return [
    `${saudacao} conseguimos uma contraproposta especial para quitação${contratoTrecho}:`,
    "",
    `• Valor para quitação: ${valorSugerido}`,
    "",
    "Esse valor será encaminhado para análise do Comitê Jurídico da Riachuelo. Havendo aprovação, o boleto oficial fica disponível no site ou aplicativo da Riachuelo para sua segurança.",
    "",
    "Como a contraproposta exige segurança no pagamento, precisamos da sua confirmação antes do envio.",
    confirmacaoPagamento,
  ].join("\n");
}

function buildCounterSuggestionSummary(suggestion) {
  const valorAtualizado = Number(suggestion?.valorAtualizado || 0);
  const valorSugerido = Number(suggestion?.valorSugerido || 0);
  const percentualAceito = Number(suggestion?.percentualMedio || 0);
  const percentualDesconto =
    valorAtualizado > 0
      ? ((valorAtualizado - valorSugerido) / valorAtualizado) * 100
      : Math.max(0, 100 - percentualAceito * 100);

  return [
    "Resumo da divida",
    `- Valor atualizado: ${suggestion?.valorAtualizadoFormatado || formatCurrency(valorAtualizado)}`,
    `- Valor sugerido para quitacao: ${suggestion?.valorSugeridoFormatado || formatCurrency(valorSugerido)}`,
    `- Desconto aplicado sobre o atualizado: ${percentualDesconto.toFixed(2)}%`,
    suggestion?.percentualMedioFormatado
      ? `- Media historica de fechamento: ${suggestion.percentualMedioFormatado} do valor atualizado`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function syncCounterSuggestionTab({ hidden, value, mode, text, metaHtml }) {
  if (!elements.counterSuggestionCardTab) return;

  elements.counterSuggestionCardTab.hidden = hidden;
  elements.counterSuggestionValueTab.textContent = value || "--";
  elements.counterSuggestionModeTab.textContent = mode || "HistÃ³rico";
  elements.counterSuggestionTextTab.textContent =
    text ||
    "A sugestÃ£o vai aparecer aqui quando vocÃª consultar a carteira Riachuelo.";
  elements.counterSuggestionMetaTab.innerHTML = metaHtml || "";
}

function clearCounterSuggestion() {
  state.counterSuggestion = null;
  elements.counterSuggestionCard.hidden = true;
  elements.counterSuggestionValue.textContent = "--";
  elements.counterSuggestionMode.textContent = "Histórico";
  elements.counterSuggestionText.textContent =
    "A sugestão vai aparecer aqui quando você consultar a carteira Riachuelo.";
  elements.counterSuggestionMeta.innerHTML = "";
  syncCounterSuggestionTab({
    hidden: true,
    value: "--",
    mode: "HistÃ³rico",
    text: "A oferta de contraproposta vai aparecer aqui quando vocÃª consultar a carteira Riachuelo.",
    metaHtml: "",
  });
}

function renderCounterSuggestion() {
  if (!state.counterSuggestion) {
    clearCounterSuggestion();
    return;
  }

  const suggestion = state.counterSuggestion;
  const metaItems = [
    suggestion.NomeFantasia || "",
    suggestion.faixaAtraso || "",
    suggestion.ProdutoDescricao || suggestion.produto || "",
    suggestion.sampleSize ? `${suggestion.sampleSize} histórico(s)` : "",
    suggestion.percentualMedioFormatado
      ? `Média ${suggestion.percentualMedioFormatado}`
      : "",
  ].filter(Boolean);

  elements.counterSuggestionCard.hidden = false;
  elements.counterSuggestionValue.textContent =
    suggestion.valorSugeridoFormatado || "--";
  elements.counterSuggestionMode.textContent = suggestion.usedFallback
    ? "Fallback"
    : "Histórico";
  elements.counterSuggestionText.textContent = suggestion.usedFallback
    ? suggestion.fallbackReason ||
      "Não houve base suficiente; foi aplicado o fallback de 70% de desconto."
    : `Sugestão calculada com base em históricos compatíveis da mesma carteira, faixa e produto.`;
  elements.counterSuggestionMeta.innerHTML = metaItems
    .map((item) => `<span class="meta-tag">${item}</span>`)
    .join("");
}

function clearCounterSuggestion() {
  state.counterSuggestion = null;
  elements.counterSuggestionCard.hidden = true;
  elements.counterSuggestionValue.textContent = "--";
  elements.counterSuggestionMode.textContent = "Histórico";
  elements.counterSuggestionText.textContent =
    "A oferta de contraproposta vai aparecer aqui quando você consultar a carteira Riachuelo.";
  elements.counterSuggestionMeta.innerHTML = "";
}

function renderCounterSuggestion() {
  if (!state.counterSuggestion) {
    clearCounterSuggestion();
    return;
  }

  const suggestion = state.counterSuggestion;
  const suggestionSummary = buildCounterSuggestionSummary(suggestion);
  const metaItems = [
    suggestion.NomeFantasia || "",
    suggestion.faixaAtraso || "",
    suggestion.produtoNormalizado || suggestion.ProdutoDescricao || suggestion.produto || "",
    suggestion.matchStrategy === "produto_alternativo"
      ? `Base histórica: ${suggestion.produtoHistoricoNormalizado || suggestion.produtoHistorico || "produto alternativo"}`
      : "",
    suggestion.idCarteira ? `ID ${suggestion.idCarteira}` : "",
    suggestion.sampleSize ? `${suggestion.sampleSize} histórico(s)` : "",
    suggestion.percentualMedioFormatado
      ? `Média ${suggestion.percentualMedioFormatado}`
      : "",
  ].filter(Boolean);

  elements.counterSuggestionCard.hidden = false;
  elements.counterSuggestionValue.textContent =
    suggestion.valorSugeridoFormatado || "--";
  elements.counterSuggestionMode.textContent = suggestion.usedFallback
    ? "Fallback"
    : "Histórico";
  elements.counterSuggestionText.textContent = suggestionSummary;
  elements.counterSuggestionMeta.innerHTML = metaItems
    .map((item) => `<span class="meta-tag">${item}</span>`)
    .join("");
}

function clearCounterSuggestion() {
  state.counterSuggestion = null;

  const text =
    "A oferta de contraproposta vai aparecer aqui quando voce consultar a carteira Riachuelo.";
  elements.counterSuggestionCard.hidden = true;
  elements.counterSuggestionValue.textContent = "--";
  elements.counterSuggestionMode.textContent = "Historico";
  elements.counterSuggestionText.textContent = text;
  elements.counterSuggestionMeta.innerHTML = "";
  syncCounterSuggestionTab({
    hidden: true,
    value: "--",
    mode: "Historico",
    text,
    metaHtml: "",
  });
}

function renderCounterSuggestion() {
  if (!state.counterSuggestion) {
    clearCounterSuggestion();
    return;
  }

  const suggestion = state.counterSuggestion;
  const suggestionSummary = buildCounterSuggestionSummary(suggestion);
  const metaItems = [
    suggestion.NomeFantasia || "",
    suggestion.faixaAtraso || "",
    suggestion.produtoNormalizado || suggestion.ProdutoDescricao || suggestion.produto || "",
    suggestion.matchStrategy === "produto_alternativo"
      ? `Base historica: ${suggestion.produtoHistoricoNormalizado || suggestion.produtoHistorico || "produto alternativo"}`
      : "",
    suggestion.idCarteira ? `ID ${suggestion.idCarteira}` : "",
    suggestion.sampleSize ? `${suggestion.sampleSize} historico(s)` : "",
    suggestion.percentualMedioFormatado
      ? `Media ${suggestion.percentualMedioFormatado}`
      : "",
  ].filter(Boolean);
  const metaHtml = metaItems
    .map((item) => `<span class="meta-tag">${escapeHtml(item)}</span>`)
    .join("");
  const mode = suggestion.usedFallback ? "Fallback" : "Historico";
  const value = suggestion.valorSugeridoFormatado || "--";

  elements.counterSuggestionCard.hidden = false;
  elements.counterSuggestionValue.textContent = value;
  elements.counterSuggestionMode.textContent = mode;
  elements.counterSuggestionText.textContent = suggestionSummary;
  elements.counterSuggestionMeta.innerHTML = metaHtml;
  syncCounterSuggestionTab({
    hidden: false,
    value,
    mode,
    text: suggestionSummary,
    metaHtml,
  });
}

function renderContratos(preferredIdcon = "") {
  elements.idconSelect.innerHTML = "";

  if (!Array.isArray(state.contratos) || state.contratos.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum contrato encontrado";
    elements.idconSelect.appendChild(option);
    elements.idconSelect.disabled = true;
    elements.contractsRail.innerHTML =
      '<div class="empty-state">Nenhum contrato carregado.</div>';
    elements.contractsCount.textContent = "0";
    elements.selectedContractText.textContent = "Nenhum";
    elements.metricBusca.textContent = "Sem contratos";
    renderScripts();
    renderCrmSnapshot();
    return;
  }

  const currentValue = String(elements.idconSelect.value || "");
  const selectedValue = String(preferredIdcon || currentValue || "");
  const aggregateBemol = shouldAggregateBemolContracts();
  const fragment = document.createDocumentFragment();

  state.contratos.forEach((contrato, index) => {
    const option = document.createElement("option");
    option.value = contrato.idcon;
    option.textContent = `IDCON ${contrato.idcon} - ${formatCurrency(
      contrato.valorAtualizado
    )} - ${contrato.descricao || "Sem descrição"}`;

    if (
      (selectedValue && selectedValue === String(contrato.idcon)) ||
      (!selectedValue && index === 0)
    ) {
      option.selected = true;
    }

    elements.idconSelect.appendChild(option);

    const article = document.createElement("article");
    article.className = "contract-card";
    article.dataset.idcon = contrato.idcon;
    article.innerHTML = `
      <button type="button">
        <div class="contract-card-top">
          <div>
            <h4>${contrato.descricao || "Contrato sem descrição"}</h4>
            <p>${contrato.contrato || `IDCON ${contrato.idcon}`}</p>
          </div>
          <strong>${formatCurrency(contrato.valorAtualizado || 0)}</strong>
        </div>
        <div class="contract-meta">
          <span class="meta-tag">IDCON ${contrato.idcon || "-"}</span>
          <span class="meta-tag">${getCarteiraLabel(contrato.agrupamento || elements.carteira.value)}</span>
          ${
            contrato.diasAtraso
              ? `<span class="meta-tag">${contrato.diasAtraso} dias</span>`
              : ""
          }
        </div>
      </button>
    `;

    article.querySelector("button").addEventListener("click", () => {
      if (shouldAggregateBemolContracts()) {
        return;
      }

      elements.idconSelect.value = contrato.idcon || "";
      updateSelectedContract();
      highlightSelectedContract();
      renderScripts();
    });

    fragment.appendChild(article);
  });

  elements.idconSelect.disabled = aggregateBemol;
  elements.contractsRail.innerHTML = "";
  elements.contractsRail.appendChild(fragment);
  if (!elements.idconSelect.value && state.contratos[0]?.idcon) {
    elements.idconSelect.value = String(state.contratos[0].idcon);
  }
  elements.contractsCount.textContent = String(state.contratos.length);
  elements.metricBusca.textContent = `${state.contratos.length} contrato(s)`;
  updateSelectedContract();
  highlightSelectedContract();
  renderScripts();
  renderCrmSnapshot();
}

function updateSelectedContract() {
  if (shouldAggregateBemolContracts() && state.contratos.length > 0) {
    elements.selectedContractText.textContent = "Todos os contratos";
    renderCrmSnapshot();
    return;
  }

  const selectedIdcon = elements.idconSelect.value;
  const selected = state.contratos.find(
    (contrato) => String(contrato.idcon) === String(selectedIdcon)
  );

  if (!selected) {
    elements.selectedContractText.textContent = "Nenhum";
    renderCrmSnapshot();
    return;
  }

  elements.selectedContractText.textContent =
    selected.contrato || `IDCON ${selected.idcon}`;
  renderCrmSnapshot();
}

function highlightSelectedContract() {
  if (shouldAggregateBemolContracts()) {
    document.querySelectorAll(".contract-card").forEach((card) => {
      card.classList.remove("is-selected");
    });
    return;
  }

  const selectedIdcon = String(elements.idconSelect.value || "");
  document.querySelectorAll(".contract-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.idcon === selectedIdcon);
  });
}

function renderScriptFilters() {
  const activeLibrary = getActiveScriptLibrary();
  const categorias = [
    "Todos",
    ...new Set(activeLibrary.map((script) => script?.categoria || "Geral")),
  ];

  if (!categorias.includes(state.scriptFilter)) {
    state.scriptFilter = "Todos";
  }

  const fragment = document.createDocumentFragment();

  categorias.forEach((categoria) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = categoria;
    button.classList.toggle("is-active", state.scriptFilter === categoria);
    button.addEventListener("click", () => {
      state.scriptFilter = categoria;
      renderScriptFilters();
      renderScripts();
    });
    fragment.appendChild(button);
  });

  elements.scriptFilters.innerHTML = "";
  elements.scriptFilters.appendChild(fragment);
  renderScriptThemesSummary();
}

function openCopyHelper(text) {
  elements.copyHelperTextarea.value = String(text || "");
  elements.copyHelper.hidden = false;
  elements.copyHelper.style.display = "grid";

  window.requestAnimationFrame(() => {
    elements.copyHelperTextarea.focus();
    elements.copyHelperTextarea.select();
    elements.copyHelperTextarea.setSelectionRange(
      0,
      elements.copyHelperTextarea.value.length
    );
  });
}

async function loadCustomScriptLibrary() {
  try {
    const response = await fetch(API.scriptsCustom);
    if (!response.ok) return;
    const data = await response.json();
    state.customScriptLibrary = data && typeof data === "object" ? data : {};
  } catch (_error) {
    state.customScriptLibrary = {};
  }
}

function openScriptDialog(title, text, { editable = false, persistable = false, mode = "preview", script = null } = {}) {
  state.scriptDialogEditable = editable;
  state.scriptDialogMode = mode;
  state.scriptDialogScript = script;
  state.scriptDialogWallet = getActiveScriptWalletKey();
  elements.copyHelperTitle.textContent = title;
  elements.copyHelperDescription.textContent = editable
    ? "Ajuste o texto como preferir e copie a versão final quando estiver pronto."
    : "Visualize o script abaixo. Se quiser ajustar alguma parte, clique em editar e depois copie a versão final.";
  elements.btnEditarHelper.textContent = editable ? "Visualizar" : "Editar";
  elements.copyHelperTextarea.readOnly = !editable;
  elements.btnSalvarScriptHelper.hidden = !persistable;
  elements.scriptEditorFields.hidden = !persistable;
  elements.scriptTitleInput.value = script?.titulo || title || "";
  elements.scriptCategoryInput.value = script?.categoria || "";
  openCopyHelper(text);
}

function openAddScriptDialog() {
  const categoria = state.scriptFilter !== "Todos" ? state.scriptFilter : "Abertura";
  openScriptDialog("Adicionar script", "", {
    editable: true,
    persistable: true,
    mode: "add",
    script: {
      categoria,
      titulo: "",
      texto: "",
    },
  });
  elements.copyHelperDescription.textContent =
    "Informe titulo, categoria e texto. Para salvar permanente, sera solicitada a senha.";

  window.requestAnimationFrame(() => {
    elements.scriptTitleInput.focus();
  });
}

function closeCopyHelper() {
  elements.copyHelper.hidden = true;
  elements.copyHelper.style.display = "none";
  elements.copyHelperTextarea.value = "";
  elements.copyHelperTextarea.readOnly = true;
  state.scriptDialogEditable = false;
  state.scriptDialogMode = "preview";
  state.scriptDialogScript = null;
  state.scriptDialogWallet = "DEFAULT";
  elements.btnSalvarScriptHelper.hidden = true;
  elements.scriptEditorFields.hidden = true;
  elements.scriptTitleInput.value = "";
  elements.scriptCategoryInput.value = "";
}

function triggerCopyButtonFeedback(button) {
  if (!button) return;

  const originalText =
    button.dataset.originalLabel || button.textContent || "Copiar mensagem";
  button.dataset.originalLabel = originalText;

  if (button._copyFeedbackTimeout) {
    window.clearTimeout(button._copyFeedbackTimeout);
  }

  button.classList.remove("is-copied");
  void button.offsetWidth;
  button.textContent = "Copiado";
  button.classList.add("is-copied");

  button._copyFeedbackTimeout = window.setTimeout(() => {
    button.textContent = button.dataset.originalLabel || originalText;
    button.classList.remove("is-copied");
    button._copyFeedbackTimeout = null;
  }, 1800);
}

function copyFromTextarea(textarea) {
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch (_error) {
    return false;
  }
}

async function copyText(text, successMessage, { forceHelper = false } = {}) {
  const normalizedText = String(text || "");

  if (forceHelper) {
    openCopyHelper(normalizedText);
  }

  try {
    if (forceHelper && copyFromTextarea(elements.copyHelperTextarea)) {
      showNotice(elements.alertOutput, "success", successMessage);
      return true;
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(normalizedText);
        showNotice(elements.alertOutput, "success", successMessage);
        return true;
      } catch (_clipboardError) {
        // Alguns navegadores expõem a API, mas negam a permissão em tempo de execução.
      }
    }

    if (forceHelper) {
      openCopyHelper(normalizedText);
      if (copyFromTextarea(elements.copyHelperTextarea)) {
        showNotice(elements.alertOutput, "success", successMessage);
        return true;
      }
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = normalizedText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      const copied = copyFromTextarea(textarea);
      document.body.removeChild(textarea);

      if (copied) {
        showNotice(elements.alertOutput, "success", successMessage);
        return true;
      }
    }
  } catch (_error) {
    // Continua para o fallback final abaixo.
  }

  openCopyHelper(normalizedText);
  showNotice(
    elements.alertOutput,
    "warning",
    "Use Ctrl + C na janela aberta para copiar o script."
  );
  return false;
}

async function handleScriptCopy(text, button = null) {
  const copied = await copyText(text, "Script copiado para a área de transferência.");

  if (copied && button) {
    triggerCopyButtonFeedback(button);
  }

  if (copied) {
    registerActivityEvent(
      "Script copiado",
      "Script de apoio copiado a partir da biblioteca."
    );
  }
}

async function saveCurrentScriptPermanently() {
  const titulo = elements.scriptTitleInput.value.trim();
  const categoria = elements.scriptCategoryInput.value.trim();
  const texto = elements.copyHelperTextarea.value.trim();

  if (!titulo || !categoria || !texto) {
    showNotice(elements.alertOutput, "error", "Informe titulo, categoria e texto do script.");
    return;
  }

  const password = window.prompt("Digite a senha para salvar o script permanente:");
  if (password === null) return;

  const baseScript = state.scriptDialogScript || {};
  const script = {
    id: baseScript.id || "",
    titulo,
    categoria,
    texto,
  };

  elements.btnSalvarScriptHelper.disabled = true;
  elements.btnSalvarScriptHelper.textContent = "Salvando...";

  try {
    const result = await postJson(API.scriptsCustom, {
      password,
      wallet: state.scriptDialogWallet || getActiveScriptWalletKey(),
      script,
    });

    state.customScriptLibrary = result.library || state.customScriptLibrary || {};
    renderScriptFilters();
    renderScripts();
    showNotice(elements.alertOutput, "success", "Script salvo permanente na biblioteca.");
    registerActivityEvent(
      "Script atualizado",
      `Script "${titulo}" salvo na biblioteca.`
    );
    closeCopyHelper();
  } catch (error) {
    showNotice(elements.alertOutput, "error", error.message || "Erro ao salvar script.");
  } finally {
    elements.btnSalvarScriptHelper.disabled = false;
    elements.btnSalvarScriptHelper.textContent = "Salvar permanente";
  }
}

function getScriptText(script) {
  if (shouldUseStandardScriptText(script)) {
    return cleanupTemplateText(getStandardScriptText(script));
  }

  return applyTemplate(script.texto || script.text || "");
}

function renderScripts() {
  try {
    const scripts = getFilteredScripts().filter((script) => script && typeof script === "object");

    elements.scriptsCounter.textContent = `${scripts.length} script(s)`;
    elements.scriptsWalletBadge.textContent = getActiveScriptLibraryLabel();
    elements.metricOpcoes.textContent = `${scripts.length} scripts ativos`;

    if (scripts.length === 0) {
      elements.scriptsGrid.innerHTML =
        '<div class="empty-state">Nenhum script encontrado.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    scripts.forEach((script) => {
      const categoria = script.categoria || "Geral";
      const titulo = script.titulo || "Script sem titulo";
      const personalizedText = getScriptText(script);
      const article = document.createElement("article");
      article.className = "script-card";
      article.dataset.scriptCategory = toCategorySlug(categoria);
      article.innerHTML = `
        <div class="script-card-head">
          <div>
            <span class="meta-tag script-type-tag">${escapeHtml(categoria)}</span>
            <h4>${escapeHtml(titulo)}</h4>
            <p class="script-card-subtitle">${escapeHtml(getScriptDescription(script))}</p>
          </div>
        </div>
        <div class="script-card-actions">
          <div class="script-action-group">
            <button type="button" class="script-action-button script-preview-button">Preview</button>
            <button type="button" class="script-action-button script-edit-button">Editar</button>
            <button type="button" class="script-action-button script-save-button">Ajustar permanente</button>
            <button type="button" class="script-copy-button">Copiar script</button>
          </div>
        </div>
      `;

      article
        .querySelector(".script-preview-button")
        .addEventListener("click", () =>
          openScriptDialog(titulo, personalizedText, { editable: false })
        );

      article
        .querySelector(".script-edit-button")
        .addEventListener("click", () =>
          openScriptDialog(titulo, personalizedText, { editable: true })
        );

      article
        .querySelector(".script-save-button")
        .addEventListener("click", () => {
          const templateText = shouldUseStandardScriptText(script)
            ? getStandardScriptText(script)
            : script.texto || script.text || "";
          openScriptDialog(titulo, personalizedText, {
            editable: true,
            persistable: true,
            mode: "edit",
            script: {
              ...script,
              categoria,
              titulo,
            },
          });
          elements.copyHelperTextarea.value = cleanupTemplateText(templateText);
        });

      article
        .querySelector(".script-copy-button")
        .addEventListener("click", (event) =>
          handleScriptCopy(personalizedText, event.currentTarget)
        );

      fragment.appendChild(article);
    });

    elements.scriptsGrid.innerHTML = "";
    elements.scriptsGrid.appendChild(fragment);
  } catch (error) {
    console.error("Erro ao renderizar scripts", error);
    elements.scriptsGrid.innerHTML =
      '<div class="empty-state">Nao foi possivel carregar os scripts. Tente atualizar a pagina.</div>';
  }
}

function updateCliente(nome, primeiroNome) {
  state.clienteNome = String(nome || "").trim();
  state.primeiroNome = getPrimeiroNome(state.clienteNome, primeiroNome || "");
  elements.clienteChip.textContent = state.clienteNome || "Nenhum cliente carregado";
  elements.metricCliente.textContent = state.clienteNome || "Não carregado";
  renderScripts();
  renderCrmSnapshot();
}

function clearNegotiationContext({
  clearPhone = false,
  clearCarteira = false,
  preserveMode = true,
} = {}) {
  const currentMode = String(elements.tipoNegociacao.value || "");

  state.contratos = [];
  state.clienteNome = "";
  state.primeiroNome = "";
  state.documento = "";
  state.workflowStatus = "Não iniciado";
  state.lastInteractionLabel = "";
  state.activityLog = [];
  resetLoadedContext();
  resetScriptNavigation();
  updateCliente("", "");
  renderContratos();
  clearCounterSuggestion();
  setMensagem("");
  clearNotice(elements.alertForm);
  clearNotice(elements.alertOutput);
  setStatus("idle", "Parado");
  elements.metricBusca.textContent = "Aguardando";
  elements.metricMensagem.textContent = "Sem cÃ¡lculo";
  activateTab("mensagem");

  if (clearPhone) {
    elements.telefone.value = "";
  }

  if (clearCarteira) {
    elements.carteira.value = "";
  }

  updateCarteira();

  if (preserveMode && shouldShowTipoNegociacaoField()) {
    const config = getNegotiationModeConfig();
    if (config?.options?.some((option) => option.value === currentMode)) {
      elements.tipoNegociacao.value = currentMode;
      updateCarteira();
    }
  }

  renderCrmSnapshot();
}

function updateCarteira() {
  elements.metricCarteira.textContent = getCarteiraLabel(elements.carteira.value);
  const carteira = getCarteiraValue();
  const isManualDiscountWallet = MANUAL_DISCOUNT_WALLETS.has(carteira);
  const installmentLimit = getInstallmentToolLimit();
  const showTipoNegociacao = shouldShowTipoNegociacaoField(carteira);
  syncTipoNegociacaoOptions(carteira);
  elements.tipoNegociacaoField.hidden = !showTipoNegociacao;
  const showCounterProposal = carteira === "RCHLO";
  elements.btnSugerirContra.hidden = !showCounterProposal;
  if (elements.btnSugerirContraTab) {
    elements.btnSugerirContraTab.hidden = true;
  }
  if (elements.tabContraProposta) {
    elements.tabContraProposta.hidden = true;
  }
  if (state.activeTab === "contraproposta") {
    activateTab("mensagem");
  }
  elements.manualDiscountField.hidden = !isManualDiscountWallet;
  elements.superdbInstallmentTools.hidden = !shouldShowInstallmentTools();
  elements.idconSelect.disabled =
    shouldAggregateBemolContracts() || state.contratos.length === 0;
  elements.parcelaPersonalizada.max = installmentLimit ? String(installmentLimit) : "17";
  elements.parcelaPersonalizada.placeholder = installmentLimit
    ? `Ex.: ${Math.min(installmentLimit, 9)}`
    : "Ex.: 9";
  elements.installmentRangeLabel.textContent = installmentLimit
    ? `Outra parcela (até ${installmentLimit}x)`
    : "Outra parcela";
  if (!isManualDiscountWallet) {
    elements.descontoManual.value = "";
  }
  if (!shouldShowInstallmentTools()) {
    elements.parcelaPersonalizada.value = "";
  }
  if ((carteira === "SUPERDB" || carteira === "GMATEUS") && !elements.dataPagamento.value) {
    elements.dataPagamento.value = todayIso();
  }
  updateSelectedContract();
  highlightSelectedContract();
  clearCounterSuggestion();
  renderScriptFilters();
  renderScripts();
  renderCrmSnapshot();
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `Erro HTTP ${response.status}`);
  }

  return data;
}

function buildPayload(customInstallment = "") {
  return {
    telefone: elements.telefone.value.trim(),
    carteira: elements.carteira.value.trim(),
    idcon: elements.idconSelect.value || "",
    tipoNegociacao: Number(elements.tipoNegociacao.value || 2),
    dataPagamento: elements.dataPagamento.value || null,
    descontoManual: sanitizeNumericInput(elements.descontoManual.value),
    parcelaPersonalizada: sanitizeInstallmentInput(customInstallment),
    valorEntrada: sanitizeValorEntrada(elements.valorEntrada.value),
  };
}

async function runCalculation({ customInstallment = "" } = {}) {
  clearNotice(elements.alertForm);
  clearNotice(elements.alertOutput);

  const payload = buildPayload(customInstallment);

  if (!payload.telefone || !payload.carteira) {
    showNotice(elements.alertForm, "error", "Informe telefone e carteira.");
    return;
  }

  if (
    MANUAL_DISCOUNT_WALLETS.has(String(payload.carteira).toUpperCase()) &&
    !payload.descontoManual
  ) {
    showNotice(elements.alertForm, "error", "Informe o desconto manual para essa carteira.");
    return;
  }

  if (customInstallment) {
    const parcelas = Number(payload.parcelaPersonalizada || 0);
    const installmentLimit = getInstallmentToolLimit() || 17;
    if (!Number.isInteger(parcelas) || parcelas < 2 || parcelas > installmentLimit) {
      showNotice(
        elements.alertForm,
        "error",
        `Informe uma parcela entre 2 e ${installmentLimit}.`
      );
      return;
    }
  }

  if (shouldAggregateBemolContracts()) {
    activateTab("mensagem");
    setStatus("busy", "Consolidando contratos da Bemol");
    elements.btnCalcular.disabled = true;
    elements.btnCalcularParcela.disabled = true;
    elements.btnCalcularLabel.textContent = "Consolidando...";
    setMensagem("");
    elements.mensagemZap.textContent = "Consolidando contratos...";

    try {
      await runBemolAggregateCalculation(payload);
    } catch (error) {
      setMensagem("");
      elements.mensagemZap.textContent = "NÃ£o foi possÃ­vel consolidar os contratos.";
      elements.mensagemZap.classList.add("placeholder");
      showNotice(elements.alertOutput, "error", error.message);
      setStatus("error", "Erro na consolidaÃ§Ã£o");
    } finally {
      elements.btnCalcular.disabled = false;
      elements.btnCalcularParcela.disabled = false;
      elements.btnCalcularLabel.textContent = "Recalcular mensagem";
    }
    return;
  }

  activateTab("mensagem");
  setStatus("busy", customInstallment ? "Calculando parcela" : "Recalculando mensagem");
  elements.btnCalcular.disabled = true;
  elements.btnCalcularParcela.disabled = true;
  elements.btnCalcularLabel.textContent = customInstallment
    ? "Calculando..."
    : "Recalculando...";
  setMensagem("");
  elements.mensagemZap.textContent = customInstallment
    ? "Calculando parcela..."
    : "Recalculando mensagem...";

  try {
    const result = await postJson(API.recalcular, payload);
    syncUiWithDebtResult(result, { replaceContracts: true });
    setMensagem(result.mensagem_zap_unica || result.mensagem_zap || "");

    if (!state.mensagem) {
      throw new Error("O servidor não retornou a mensagem final.");
    }

    rememberLoadedContext();
    setWorkflowStatus("Em negociação");
    registerActivityEvent(
      customInstallment ? "Parcela personalizada calculada" : "Mensagem calculada",
      `Contrato ${elements.selectedContractText.textContent || "selecionado"} preparado para envio.`
    );
    showNotice(
      elements.alertOutput,
      "success",
      customInstallment ? "Parcela calculada com sucesso." : "Mensagem gerada com sucesso."
    );
    setStatus("ok", "Mensagem pronta");
  } catch (error) {
    setMensagem("");
    elements.mensagemZap.textContent = "Não foi possível gerar a mensagem.";
    elements.mensagemZap.classList.add("placeholder");
    showNotice(elements.alertOutput, "error", error.message);
    setStatus("error", customInstallment ? "Erro ao calcular parcela" : "Erro no recálculo");
  } finally {
    elements.btnCalcular.disabled = false;
    elements.btnCalcularParcela.disabled = false;
    elements.btnCalcularLabel.textContent = "Recalcular mensagem";
  }
}

async function runCounterProposalSuggestion() {
  clearNotice(elements.alertForm);
  clearNotice(elements.alertOutput);

  const payload = buildPayload();

  if (!payload.telefone || !payload.carteira) {
    showNotice(elements.alertForm, "error", "Informe telefone e carteira.");
    return;
  }

  if (String(payload.carteira).toUpperCase() !== "RCHLO") {
    showNotice(
      elements.alertForm,
      "error",
      "A sugestão de contra proposta está disponível apenas para Riachuelo."
    );
    return;
  }

  elements.btnSugerirContra.disabled = true;
  activateTab("mensagem");
  setStatus("busy", "Buscando sugestão de contra proposta");
  setMensagem("");
  elements.mensagemZap.textContent = "Montando contra proposta...";

  try {
    const result = await postJson(API.sugerirContraProposta, payload);
    syncUiWithDebtResult(result, { replaceContracts: true });
    const message = buildCounterProposalMessage(result);
    state.counterSuggestion = result;
    renderCounterSuggestion();
    setMensagem(message);
    rememberLoadedContext();
    setWorkflowStatus("Em negociação");
    registerActivityEvent(
      "Contra proposta sugerida",
      "Sugestão histórica pronta para revisão e envio."
    );
    showNotice(elements.alertOutput, "success", "Mensagem de contra proposta pronta.");
    setStatus("ok", "Contra proposta pronta");
  } catch (error) {
    clearCounterSuggestion();
    setMensagem("");
    elements.mensagemZap.textContent = "Não foi possível gerar a contra proposta.";
    elements.mensagemZap.classList.add("placeholder");
    showNotice(elements.alertOutput, "error", error.message);
    setStatus("error", "Erro ao sugerir contra proposta");
  } finally {
    elements.btnSugerirContra.disabled = false;
  }
}

elements.idconSelect.addEventListener("change", () => {
  updateSelectedContract();
  highlightSelectedContract();
  clearCounterSuggestion();
  renderScripts();
  if (!shouldAggregateBemolContracts() && elements.idconSelect.value) {
    registerActivityEvent(
      "Contrato em foco alterado",
      `${elements.selectedContractText.textContent || "Contrato"} selecionado para a negociação.`
    );
  }
});

elements.carteira.addEventListener("change", () => {
  if (hasLoadedNegotiationContext() && getCarteiraValue() !== state.loadedCarteira) {
    clearNegotiationContext({ preserveMode: false });
    return;
  }
  resetScriptNavigation();
  updateCarteira();
});
elements.tipoNegociacao.addEventListener("change", updateCarteira);
elements.dataPagamento.addEventListener("input", renderScripts);
elements.valorEntrada.addEventListener("input", renderScripts);
elements.telefone.addEventListener("input", () => {
  if (!hasLoadedNegotiationContext()) {
    renderCrmSnapshot();
    return;
  }

  if (digitsOnly(elements.telefone.value) !== state.loadedTelefone) {
    clearNegotiationContext({ preserveMode: true });
  }
  renderCrmSnapshot();
});
elements.scriptSearch?.addEventListener("input", () => {
  state.scriptSearch = elements.scriptSearch.value || "";
  renderScriptThemesSummary();
  renderScripts();
});
elements.btnSugerirContra.addEventListener("click", runCounterProposalSuggestion);

elements.tabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    activateTab(trigger.dataset.tabTrigger);
  });
});

elements.btnBuscarDividas.addEventListener("click", async () => {
  clearNotice(elements.alertForm);
  clearNotice(elements.alertOutput);
  updateCarteira();

  const telefone = elements.telefone.value.trim();
  const carteira = elements.carteira.value.trim();

  if (!telefone || !carteira) {
    showNotice(elements.alertForm, "error", "Informe telefone e carteira.");
    return;
  }

  setStatus("busy", "Buscando dívidas");
  elements.btnBuscarDividas.disabled = true;
  elements.btnCalcular.disabled = true;

  try {
    const result = await postJson(API.listar, { telefone, carteira });
    clearCounterSuggestion();
    syncUiWithDebtResult(result, { replaceContracts: true });
    setMensagem("");
    rememberLoadedContext();
    setWorkflowStatus("Localizado");
    registerActivityEvent(
      "Cliente localizado",
      `${state.contratos.length} contrato(s) carregado(s) para atendimento.`
    );
    showNotice(elements.alertForm, "success", "Dívidas carregadas com sucesso.");
    setStatus("ok", "Contratos carregados");
    elements.btnCalcular.disabled = false;
  } catch (error) {
    state.contratos = [];
    state.documento = "";
    state.workflowStatus = "Não iniciado";
    state.lastInteractionLabel = "";
    state.activityLog = [];
    renderContratos();
    updateCliente("", "");
    clearCounterSuggestion();
    setMensagem("");
    showNotice(elements.alertForm, "error", error.message);
    setStatus("error", "Erro ao buscar dívidas");
    elements.btnCalcular.disabled = false;
  } finally {
    elements.btnBuscarDividas.disabled = false;
  }
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runCalculation();
});

elements.btnCalcularParcela.addEventListener("click", async () => {
  await runCalculation({
    customInstallment: elements.parcelaPersonalizada.value,
  });
});

elements.btnCopiar.addEventListener("click", async () => {
  if (!state.mensagem) return;
  const copied = await copyText(
    state.mensagem,
    "Mensagem copiada para a área de transferência."
  );

  if (copied) {
    triggerCopyButtonFeedback(elements.btnCopiar);
    registerActivityEvent(
      "Mensagem copiada",
      "Texto final preparado para envio ao cliente."
    );
  }
});

elements.btnAdicionarScript?.addEventListener("click", openAddScriptDialog);
elements.btnSalvarScriptHelper?.addEventListener("click", saveCurrentScriptPermanently);
elements.btnFecharCopyHelper.addEventListener("click", closeCopyHelper);
elements.btnEditarHelper.addEventListener("click", () => {
  state.scriptDialogEditable = !state.scriptDialogEditable;
  elements.copyHelperTextarea.readOnly = !state.scriptDialogEditable;
  elements.btnEditarHelper.textContent = state.scriptDialogEditable
    ? "Visualizar"
    : "Editar";
  elements.copyHelperDescription.textContent = state.scriptDialogEditable
    ? "Ajuste o texto como preferir e copie a versão final quando estiver pronto."
    : "Visualize o script abaixo. Se quiser ajustar alguma parte, clique em editar e depois copie a versão final.";

  window.requestAnimationFrame(() => {
    elements.copyHelperTextarea.focus();
    if (state.scriptDialogEditable) {
      const length = elements.copyHelperTextarea.value.length;
      elements.copyHelperTextarea.setSelectionRange(length, length);
    } else {
      elements.copyHelperTextarea.select();
      elements.copyHelperTextarea.setSelectionRange(
        0,
        elements.copyHelperTextarea.value.length
      );
    }
  });
});

elements.btnCopiarHelper.addEventListener("click", async () => {
  const copied = await copyText(
    elements.copyHelperTextarea.value,
    "Script copiado para a área de transferência."
  );

  if (copied) {
    triggerCopyButtonFeedback(elements.btnCopiarHelper);
    registerActivityEvent(
      "Script copiado",
      "Script de apoio copiado a partir da biblioteca."
    );
  }
});

elements.copyHelper.addEventListener("click", (event) => {
  if (event.target === elements.copyHelper) {
    closeCopyHelper();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.copyHelper.hidden) {
    closeCopyHelper();
  }
});

elements.btnLimpar.addEventListener("click", () => {
  elements.form.reset();
  clearNegotiationContext({
    clearPhone: true,
    clearCarteira: true,
    preserveMode: false,
  });
});

async function initializeApp() {
  await loadCustomScriptLibrary();
  updateCarteira();
  renderContratos();
  renderScriptFilters();
  renderScripts();
  clearCounterSuggestion();
  setMensagem("");
  setStatus("idle", "Parado");
  activateTab("mensagem");
}

initializeApp();
