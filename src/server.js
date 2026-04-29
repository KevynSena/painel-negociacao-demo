const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const {
  config,
  getMissingConfig,
  getMissingSqlServerConfig,
} = require("./config");
const {
  listarIdcons,
  recalcularMensagem,
  sugerirContraPropostaRiachuelo,
} = require("./services/nectarService");
const {
  isDemoRequest,
  listarIdconsDemo,
  recalcularMensagemDemo,
  sugerirContraPropostaDemo,
} = require("./services/demoService");
const {
  getHistoricalRefreshStatus,
  startHistoricalRefreshSchedule,
} = require("./services/riachueloCounterProposalService");
const { onlyDigits } = require("./utils/xml");

const app = express();
const publicDir = path.resolve(process.cwd(), "public");
const dataDir = path.resolve(process.cwd(), "data");
const customScriptsFile = path.join(dataDir, "custom-scripts.json");
const scriptAdminPassword = process.env.SCRIPT_ADMIN_PASSWORD || (config.demoMode ? "demo-admin" : "change-me");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

function maskPhone(value) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length <= 4) return digits;
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function logApiError(route, payload, error) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route,
      carteira: String(payload?.carteira || "").trim().toUpperCase(),
      telefone: maskPhone(payload?.telefone),
      idcon: String(payload?.idcon || "").trim(),
      statusCode: error?.statusCode || 500,
      message: error?.message || "Erro inesperado",
    })
  );
}

function getConfigError() {
  const missing = getMissingConfig();
  if (missing.length === 0) return null;

  return {
    status: 500,
    body: {
      error: "Configuração incompleta do Néctar.",
      missingKeys: missing,
    },
  };
}

async function readCustomScripts() {
  try {
    const raw = await fs.readFile(customScriptsFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeCustomScripts(data) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(customScriptsFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function validateScriptPayload(body) {
  const password = String(body.password || "");
  if (password !== scriptAdminPassword) {
    const error = new Error("Senha invalida para salvar scripts.");
    error.statusCode = 401;
    throw error;
  }

  const wallet = String(body.wallet || "DEFAULT").trim().toUpperCase() || "DEFAULT";
  const script = body.script || {};
  const titulo = String(script.titulo || "").trim();
  const categoria = String(script.categoria || "").trim();
  const texto = String(script.texto || script.text || "").trim();

  if (!titulo || !categoria || !texto) {
    const error = new Error("Titulo, categoria e texto do script sao obrigatorios.");
    error.statusCode = 400;
    throw error;
  }

  const idSource = String(script.id || titulo)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const id = idSource || `script-${Date.now()}`;

  return {
    wallet,
    script: {
      id,
      categoria,
      titulo,
      texto,
      custom: true,
      updatedAt: new Date().toISOString(),
    },
  };
}

function validateLookupPayload(body) {
  const telefone = onlyDigits(body.telefone);
  const carteira = String(body.carteira || "").trim().toUpperCase();

  if (!telefone || !carteira) {
    const error = new Error("Telefone e carteira são obrigatórios.");
    error.statusCode = 400;
    throw error;
  }

  return {
    telefone,
    carteira,
    idcon: String(body.idcon || "").trim(),
    tipoNegociacao: Number(body.tipoNegociacao) || 2,
    dataPagamento: body.dataPagamento || null,
    descontoManual: String(body.descontoManual || "").trim(),
    parcelaPersonalizada: String(body.parcelaPersonalizada || "").trim(),
    valorEntrada: String(body.valorEntrada || "").trim(),
  };
}

app.get("/api/health", (_request, response) => {
  const missingKeys = getMissingConfig();
  const missingSqlKeys = getMissingSqlServerConfig();
  response.json({
    ok: true,
    service: "painel-negociacao-nectar",
    demoMode: config.demoMode,
    configured: missingKeys.length === 0,
    missingKeys,
    riachueloCounterProposal: {
      configured: missingSqlKeys.length === 0,
      missingKeys: missingSqlKeys,
      ...getHistoricalRefreshStatus(),
    },
  });
});

app.post("/api/listar-idcons", async (request, response) => {
  try {
    const payload = validateLookupPayload(request.body || {});
    if (isDemoRequest(payload)) {
      response.json(listarIdconsDemo(payload));
      return;
    }

    const configError = getConfigError();
    if (configError) {
      response.status(configError.status).json(configError.body);
      return;
    }

    const result = await listarIdcons(payload);
    response.json(result);
  } catch (error) {
    logApiError("/api/listar-idcons", request.body || {}, error);
    response.status(error.statusCode || 500).json({
      error: error.message || "Erro ao listar contratos.",
      details: error.responseBody || undefined,
    });
  }
});

app.post("/api/recalcular", async (request, response) => {
  try {
    const payload = validateLookupPayload(request.body || {});
    if (isDemoRequest(payload)) {
      response.json(recalcularMensagemDemo(payload));
      return;
    }

    const configError = getConfigError();
    if (configError) {
      response.status(configError.status).json(configError.body);
      return;
    }

    const result = await recalcularMensagem(payload);
    response.json(result);
  } catch (error) {
    logApiError("/api/recalcular", request.body || {}, error);
    response.status(error.statusCode || 500).json({
      error: error.message || "Erro ao recalcular negociação.",
      details: error.responseBody || undefined,
    });
  }
});

app.post("/api/sugerir-contraproposta", async (request, response) => {
  try {
    const payload = validateLookupPayload(request.body || {});
    if (isDemoRequest(payload)) {
      response.json(sugerirContraPropostaDemo(payload));
      return;
    }

    const configError = getConfigError();
    if (configError) {
      response.status(configError.status).json(configError.body);
      return;
    }

    const result = await sugerirContraPropostaRiachuelo(payload);
    response.json(result);
  } catch (error) {
    logApiError("/api/sugerir-contraproposta", request.body || {}, error);
    response.status(error.statusCode || 500).json({
      error: error.message || "Erro ao sugerir contra proposta.",
      details: error.responseBody || undefined,
    });
  }
});

app.get("/api/scripts/custom", async (_request, response) => {
  try {
    response.json(await readCustomScripts());
  } catch (error) {
    response.status(500).json({
      error: "Erro ao carregar scripts personalizados.",
    });
  }
});

app.post("/api/scripts/custom", async (request, response) => {
  try {
    const { wallet, script } = validateScriptPayload(request.body || {});
    const current = await readCustomScripts();
    const scripts = Array.isArray(current[wallet]) ? current[wallet] : [];
    const nextScripts = scripts.filter((item) => String(item.id) !== script.id);
    nextScripts.push(script);
    current[wallet] = nextScripts;
    await writeCustomScripts(current);

    response.json({
      ok: true,
      wallet,
      script,
      library: current,
    });
  } catch (error) {
    response.status(error.statusCode || 500).json({
      error: error.message || "Erro ao salvar script personalizado.",
    });
  }
});

app.use((_request, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

if (!config.demoMode && require.main === module) {
  startHistoricalRefreshSchedule();
}

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Painel rodando em http://localhost:${config.port}`);
  });
}

module.exports = app;
