const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const config = {
  port: Number(process.env.PORT || 3000),
  demoMode: (process.env.DEMO_MODE || "").toLowerCase() === "true",
  nectarBaseUrl:
    process.env.NECTAR_BASE_URL ||
    "https://example.invalid/WSNectar/Servicos/ServicoNectar.svc",
  nectarCnpj: process.env.NECTAR_CNPJ || "",
  nectarCodigoParceiro: process.env.NECTAR_CODIGO_PARCEIRO || "1008",
  nectarUsuario: process.env.NECTAR_USU || "",
  nectarSenha: process.env.NECTAR_PASS || "",
  rejectUnauthorized: process.env.NECTAR_REJECT_UNAUTHORIZED !== "false",
  nectarTimeoutMs: Number(process.env.NECTAR_TIMEOUT_MS || 30000),
  sqlServerHost: process.env.SQLSERVER_HOST || "",
  sqlServerPort: Number(process.env.SQLSERVER_PORT || 1433),
  sqlServerDatabase: process.env.SQLSERVER_DATABASE || "",
  sqlServerUser: process.env.SQLSERVER_USER || "",
  sqlServerPassword: process.env.SQLSERVER_PASSWORD || "",
  sqlServerDomain: process.env.SQLSERVER_DOMAIN || "",
  sqlServerAuthMode: (process.env.SQLSERVER_AUTH_MODE || "ntlm").trim().toLowerCase(),
};

function getMissingConfig() {
  if (config.demoMode) return [];

  return [
    ["NECTAR_CNPJ", config.nectarCnpj],
    ["NECTAR_CODIGO_PARCEIRO", config.nectarCodigoParceiro],
    ["NECTAR_USU", config.nectarUsuario],
    ["NECTAR_PASS", config.nectarSenha],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);
}

function getMissingSqlServerConfig() {
  if (config.demoMode) return [];

  return [
    ["SQLSERVER_HOST", config.sqlServerHost],
    ["SQLSERVER_DATABASE", config.sqlServerDatabase],
    ["SQLSERVER_USER", config.sqlServerUser],
    ["SQLSERVER_PASSWORD", config.sqlServerPassword],
    ["SQLSERVER_DOMAIN", config.sqlServerDomain],
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([key]) => key);
}

module.exports = {
  config,
  getMissingConfig,
  getMissingSqlServerConfig,
};
