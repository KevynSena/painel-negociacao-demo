const { normalizeSoapXml, takeTag } = require("../utils/xml");

function extractToken(xml) {
  const normalized = normalizeSoapXml(xml);
  const token = takeTag("CodigoToken", normalized);

  if (!token) {
    throw new Error("A resposta do Néctar não trouxe CódigoToken.");
  }

  return token;
}

module.exports = {
  extractToken,
};
