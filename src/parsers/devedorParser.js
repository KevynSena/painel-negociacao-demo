const { normalizeSoapXml, takeTag } = require("../utils/xml");

function extractDevedor(xml) {
  const normalized = normalizeSoapXml(xml);
  const cpf = takeTag("CGCPF", normalized);

  if (!cpf) {
    return {
      cpfEncontrado: false,
      cpf: "",
      nome: "",
      PrimeiroNome: "",
    };
  }

  const devedorBlock = takeTag("Devedor", normalized) || normalized;
  const nome =
    takeTag("Nome", devedorBlock) || takeTag("NomeCliente", devedorBlock) || "";

  return {
    cpfEncontrado: true,
    cpf,
    nome,
    PrimeiroNome: String(nome || "").trim().split(/\s+/)[0] || "",
  };
}

module.exports = {
  extractDevedor,
};
