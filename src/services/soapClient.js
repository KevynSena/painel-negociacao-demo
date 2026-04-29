const https = require("https");
const { URL } = require("url");
const { config } = require("../config");

const keepAliveAgents = {
  strict: new https.Agent({
    keepAlive: true,
    rejectUnauthorized: true,
  }),
  relaxed: new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false,
  }),
};

function getSoapAgent() {
  return config.rejectUnauthorized
    ? keepAliveAgents.strict
    : keepAliveAgents.relaxed;
}

function postSoap(action, body) {
  const endpoint = new URL(config.nectarBaseUrl);
  const payload = String(body || "");

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: endpoint.protocol,
        hostname: endpoint.hostname,
        port: endpoint.port || 443,
        path: `${endpoint.pathname}${endpoint.search}`,
        method: "POST",
        agent: getSoapAgent(),
        rejectUnauthorized: config.rejectUnauthorized,
        headers: {
          "Content-Type": `application/soap+xml; charset=utf-8; action="${action}"`,
          Accept: "application/soap+xml",
          Connection: "keep-alive",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");

        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(raw);
            return;
          }

          const error = new Error(
            `Nectar respondeu com HTTP ${response.statusCode}.`
          );
          error.statusCode = response.statusCode;
          error.responseBody = raw;
          reject(error);
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(config.nectarTimeoutMs, () => {
      request.destroy(new Error("Tempo limite excedido na comunicação com o Nectar."));
    });
    request.write(payload);
    request.end();
  });
}

module.exports = {
  postSoap,
};
