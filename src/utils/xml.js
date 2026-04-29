function normalizeSoapXml(xml) {
  let normalized = String(xml || "");

  normalized = normalized
    .replace(/<[a-zA-Z0-9]+:/g, "<")
    .replace(/<\/[a-zA-Z0-9]+:/g, "</");

  normalized = normalized.replace(
    /<Contrato[^>]*xmlns="[^"]*">/i,
    "<ContratosRaiz>"
  );
  normalized = normalized.replace(
    /<\/Contrato>\s*<Resultado>/i,
    "</ContratosRaiz><Resultado>"
  );

  return normalized;
}

function takeTag(tag, source = "") {
  const match = String(source || "").match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );
  return match ? match[1].trim() : "";
}

function takeAll(tag, source = "") {
  return Array.from(
    String(source || "").matchAll(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi")
    )
  ).map((match) => String(match[1] || "").trim());
}

function toNumber(value) {
  if (value == null || value === "") return 0;
  let normalized = String(value).trim();

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInt(value) {
  const parsed = parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBool(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return Boolean(toNumber(value));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function cleanContractNumber(rawValue) {
  if (!rawValue) return "";

  let value = String(rawValue).trim();
  value = value.replace(/<[^>]+>/g, "");
  value = value.replace(/\s+/g, " ").trim();

  const match = value.match(/([A-Z]*\d{6,}[\d-]*)\s*$/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  if (/^[A-Z0-9-]+$/i.test(value)) {
    return value;
  }

  return value;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrencyBR(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateBR(value) {
  if (!value) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) {
    return String(value);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function toSoapDate(value) {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(value))) return String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-");
    return `${day}/${month}/${year}`;
  }
  return formatDateBR(value) || "";
}

module.exports = {
  cleanContractNumber,
  escapeXml,
  formatCurrencyBR,
  formatDateBR,
  normalizeSoapXml,
  normalizeText,
  onlyDigits,
  takeAll,
  takeTag,
  toBool,
  toInt,
  toNumber,
  toSoapDate,
};
