const { Connection, Request } = require("tedious");
const { config, getMissingSqlServerConfig } = require("../config");
const { formatCurrencyBR, normalizeText, toInt, toNumber } = require("../utils/xml");

const MIN_SAMPLE_SIZE = 5;
const FALLBACK_DISCOUNT_PERCENTAGE = 0.7;
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const MAX_STALENESS_MS = 24 * 60 * 60 * 1000;

const RIACHUELO_CARTEIRA_MAP = new Map([
  [6, "Riachuelo Cyber - 162"],
  [8, "Riachuelo Cyber - 174"],
  [9, "Riachuelo Cyber - 183"],
  [10, "Riachuelo Cyber - 230"],
  [11, "Riachuelo Cyber - 231"],
  [12, "Riachuelo Cyber - 234"],
  [13, "Riachuelo Cyber - 248"],
  [14, "Riachuelo Cyber - 250"],
  [15, "Riachuelo Cyber - 252"],
  [17, "Riachuelo Cyber - 206"],
  [19, "Riachuelo Seguros"],
  [24, "Riachuelo Cyber - 402"],
  [25, "Riachuelo Cyber - 414"],
  [26, "Riachuelo Consignado"],
  [27, "Riachuelo Cyber - 278"],
]);

const RIACHUELO_NAME_TO_ID = new Map(
  Array.from(RIACHUELO_CARTEIRA_MAP.entries()).map(([id, nome]) => [
    normalizeKeySegment(nome),
    id,
  ])
);

const LEGACY_HISTORY_QUERY = `
WITH CARTEIRA_MAP AS (
  SELECT *
  FROM (VALUES
    (6, 'Riachuelo Cyber - 162'),
    (8, 'Riachuelo Cyber - 174'),
    (9, 'Riachuelo Cyber - 183'),
    (10, 'Riachuelo Cyber - 230'),
    (11, 'Riachuelo Cyber - 231'),
    (12, 'Riachuelo Cyber - 234'),
    (13, 'Riachuelo Cyber - 248'),
    (14, 'Riachuelo Cyber - 250'),
    (15, 'Riachuelo Cyber - 252'),
    (17, 'Riachuelo Cyber - 206'),
    (19, 'Riachuelo Seguros'),
    (24, 'Riachuelo Cyber - 402'),
    (25, 'Riachuelo Cyber - 414'),
    (26, 'Riachuelo Consignado'),
    (27, 'Riachuelo Cyber - 278')
  ) AS MAP(ID_CARTEIRA, NOME_FANTASIA)
),
HISTORICO AS (
  SELECT DISTINCT
    FT.ATUALIZADO AS VALOR_ATUALIZADO,
    FT.PRINCIPAL AS VALOR_PRINCIPAL,
    ACORDO.[VALOR DO ACORDO] AS VALOR_ACORDO,
    CASE
      WHEN ATRASO < 5 THEN '01. 0000 A 0004'
      WHEN ATRASO BETWEEN 5 AND 15 AND FT.ID = 17 THEN 'RIACHUELO - 03 A 15'
      WHEN ATRASO BETWEEN 16 AND 30 AND FT.ID IN (17, 27) THEN 'RIACHUELO - 16 A 30'
      WHEN ATRASO BETWEEN 31 AND 60 AND FT.ID = 9 THEN 'RIACHUELO - 31 A 60'
      WHEN ATRASO BETWEEN 61 AND 90 AND FT.ID = 8 THEN 'RIACHUELO - 61 A 90'
      WHEN ATRASO BETWEEN 91 AND 120 AND FT.ID = 6 THEN 'RIACHUELO -  91 A 120'
      WHEN ATRASO BETWEEN 121 AND 150 AND FT.ID = 6 THEN 'RIACHUELO -  121 A 150'
      WHEN ATRASO BETWEEN 151 AND 180 AND FT.ID = 6 THEN 'RIACHUELO -  151 A 180'
      WHEN ATRASO BETWEEN 181 AND 330 AND FT.ID = 6 THEN 'RIACHUELO -  181 A 330'
      WHEN ATRASO BETWEEN 331 AND 510 AND FT.ID = 6 THEN 'RIACHUELO -  331 A 510'
      WHEN ATRASO BETWEEN 511 AND 540 AND FT.ID = 6 THEN 'RIACHUELO -  511 A 540'
      WHEN ATRASO BETWEEN 541 AND 1080 AND FT.ID = 6 THEN 'RIACHUELO -  541 A 1080'
      WHEN ATRASO BETWEEN 1081 AND 1440 AND FT.ID = 6 THEN 'RIACHUELO -  1081 A 1440'
      WHEN ATRASO > 1440 AND FT.ID = 6 THEN 'RIACHUELO > 1440'
      WHEN ATRASO BETWEEN 31 AND 60 AND FT.ID = 10 THEN 'RIACHUELO NOVAÇÃO - 31 A 60'
      WHEN ATRASO BETWEEN 61 AND 90 AND FT.ID = 10 THEN 'RIACHUELO NOVAÇÃO - 61 A 90'
      WHEN ATRASO BETWEEN 91 AND 120 AND FT.ID = 10 THEN 'RIACHUELO NOVAÇÃO - 91 A 120'
      WHEN ATRASO BETWEEN 121 AND 150 AND FT.ID = 10 THEN 'RIACHUELO NOVAÇÃO - 121 A 150'
      WHEN ATRASO BETWEEN 151 AND 180 AND FT.ID = 10 THEN 'RIACHUELO NOVAÇÃO - 151 A 180'
      WHEN ATRASO BETWEEN 181 AND 1440 AND FT.ID = 11 THEN 'RIACHUELO NOVAÇÃO LONGA'
      WHEN ATRASO BETWEEN 91 AND 120 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  91 A 120'
      WHEN ATRASO BETWEEN 121 AND 150 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  121 A 150'
      WHEN ATRASO BETWEEN 151 AND 180 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  151 A 180'
      WHEN ATRASO BETWEEN 181 AND 330 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  181 A 330'
      WHEN ATRASO BETWEEN 331 AND 510 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  331 A 510'
      WHEN ATRASO BETWEEN 511 AND 540 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  511 A 540'
      WHEN ATRASO BETWEEN 541 AND 1080 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  541 A 1080'
      WHEN ATRASO BETWEEN 1081 AND 1440 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ -  1081 A 1440'
      WHEN ATRASO BETWEEN 5 AND 30 AND FT.ID = 13 THEN 'RIACHUELO TOPAZ - 03 A 30'
      WHEN ATRASO BETWEEN 31 AND 60 AND FT.ID = 14 THEN 'RIACHUELO TOPAZ - 31 A 60'
      WHEN ATRASO BETWEEN 61 AND 90 AND FT.ID = 15 THEN 'RIACHUELO TOPAZ - 61 A 90'
    END AS FAIXA_ATRASO,
    FT.PRODUTO,
    FT.ID AS ID_CARTEIRA
  FROM NECTAR.DBO.TB_ANDAMENTO A WITH(NOLOCK)
  INNER JOIN NECTAR.DBO.TB_OCORRENCIA O WITH(NOLOCK)
    ON A.IDOCO_AND = O.IDOCO_OCO
  INNER JOIN NECTAR.DBO.TB_CONTRATO C WITH(NOLOCK)
    ON C.IDCON_CON = A.IDCON_AND
  INNER JOIN NECTAR.DBO.TB_DEVEDOR D WITH(NOLOCK)
    ON D.IDDEV_DEV = C.IDDEV_CON
  LEFT JOIN (
    SELECT
      CGCPF_DEV,
      MAX(CAST(A.DTACO_ACO AS DATE)) AS DATA_ACORDO,
      MAX(CAST(VLVEN_PAG AS MONEY)) AS [VALOR DO ACORDO],
      ROW_NUMBER () OVER (PARTITION BY D.CGCPF_DEV ORDER BY CAST(A.DTACO_ACO AS DATE) DESC) AS RN
    FROM TB_ACORDO A
    INNER JOIN NECTAR.DBO.TB_CONTRATO C WITH(NOLOCK)
      ON C.IDCON_CON = A.IDCON_ACO
    INNER JOIN NECTAR.DBO.TB_DEVEDOR D WITH(NOLOCK)
      ON D.IDDEV_DEV = C.IDDEV_CON
    LEFT JOIN NECTAR.DBO.TB_PAGAMENTO P WITH(NOLOCK)
      ON P.IDACO_PAG = A.IDACO_ACO
    INNER JOIN TB_ANDAMENTO AD WITH(NOLOCK)
      ON C.IDCON_CON = AD.IDCON_AND
    INNER JOIN TB_OCORRENCIA O WITH (NOLOCK)
      ON O.IDOCO_OCO = AD.IDOCO_AND
    WHERE
      C.IDEMP_CON IN (6,8,9,10,11,12,13,14,15,17)
      AND IDOCO_OCO IN (944,914)
    GROUP BY
      CGCPF_DEV,
      CAST(A.DTACO_ACO AS DATE)
  ) ACORDO
    ON ACORDO.CGCPF_DEV = D.CGCPF_DEV
  LEFT JOIN (
    SELECT
      CPF,
      CAST(FT.DATA_CARTEIRA AS DATE) AS DATA_CARTEIRA,
      MAX(FT.ID_EMPRESA) AS ID,
      MAX(FT.PRODUTO) AS PRODUTO,
      MAX(FT.ATUALIZADO) AS ATUALIZADO,
      MAX(FT.PRINCIPAL) AS PRINCIPAL,
      MAX(DIAS_ATRASO_ORIGINAL) AS ATRASO
    FROM SYSCOB.DBO.MIS_TBL_FOTOGRAFIA_CARTEIRA FT WITH(NOLOCK)
    GROUP BY CPF, CAST(FT.DATA_CARTEIRA AS DATE)
  ) FT
    ON FT.CPF = ACORDO.CGCPF_DEV
   AND FT.DATA_CARTEIRA = CAST(ACORDO.DATA_ACORDO AS DATE)
  WHERE
    IDOCO_OCO IN (944,914)
    AND IDEMP_CON IN (6,8,9,10,11,12,13,14,15,17)
    AND ACORDO.RN = 1
  GROUP BY
    FT.ATUALIZADO,
    FT.PRINCIPAL,
    ACORDO.[VALOR DO ACORDO],
    ATRASO,
    FT.PRODUTO,
    FT.ID
)
SELECT
  H.VALOR_ATUALIZADO,
  H.VALOR_PRINCIPAL,
  H.VALOR_ACORDO,
  H.FAIXA_ATRASO,
  H.ID_CARTEIRA,
  COALESCE(CM.NOME_FANTASIA, CONCAT('ID ', H.ID_CARTEIRA)) AS NOME_FANTASIA,
  H.PRODUTO
FROM HISTORICO H
LEFT JOIN CARTEIRA_MAP CM
  ON CM.ID_CARTEIRA = H.ID_CARTEIRA
WHERE
  H.FAIXA_ATRASO IS NOT NULL
  AND H.PRODUTO IS NOT NULL
  AND H.VALOR_ATUALIZADO > 0
  AND H.VALOR_ACORDO > 0;
`;

const HISTORY_QUERY_V2 = `
SELECT DISTINCT
    D.CGCPF_DEV AS CPF,
    ULTIMO_ACORDO.IDEMP_CON AS ID_CARTEIRA,
    FT.PRODUTO,
    FT.ATUALIZADO AS VALOR_ATUALIZADO,
    FT.PRINCIPAL AS VALOR_PRINCIPAL,
    ULTIMO_ACORDO.[VALOR DO ACORDO] AS VALOR_ACORDO,
    MAX(IIF(A.IDOCO_AND IN (944,914), CAST(A.VLREF_AND AS MONEY), 0)) AS VALOR_ACAO,
    CASE
        WHEN FT.ATRASO < 5 THEN '01. 0000 A 0004'
        WHEN FT.ATRASO BETWEEN 5 AND 15 AND FT.ID = 17 THEN 'RIACHUELO - 05 A 15'
        WHEN FT.ATRASO BETWEEN 16 AND 30 AND FT.ID IN (17,27) THEN 'RIACHUELO - 16 A 30'
        WHEN FT.ATRASO BETWEEN 31 AND 60 AND FT.ID = 9 THEN 'RIACHUELO - 31 A 60'
        WHEN FT.ATRASO BETWEEN 61 AND 90 AND FT.ID = 8 THEN 'RIACHUELO - 61 A 90'
        WHEN FT.ATRASO BETWEEN 91 AND 120 AND FT.ID = 6 THEN 'RIACHUELO - 91 A 120'
        WHEN FT.ATRASO BETWEEN 121 AND 150 AND FT.ID = 6 THEN 'RIACHUELO - 121 A 150'
        WHEN FT.ATRASO BETWEEN 151 AND 180 AND FT.ID = 6 THEN 'RIACHUELO - 151 A 180'
        WHEN FT.ATRASO BETWEEN 181 AND 330 AND FT.ID = 6 THEN 'RIACHUELO - 181 A 330'
        WHEN FT.ATRASO BETWEEN 331 AND 510 AND FT.ID = 6 THEN 'RIACHUELO - 331 A 510'
        WHEN FT.ATRASO BETWEEN 511 AND 540 AND FT.ID = 6 THEN 'RIACHUELO - 511 A 540'
        WHEN FT.ATRASO BETWEEN 541 AND 1080 AND FT.ID = 6 THEN 'RIACHUELO - 541 A 1080'
        WHEN FT.ATRASO BETWEEN 1081 AND 1440 AND FT.ID = 6 THEN 'RIACHUELO - 1081 A 1440'
        WHEN FT.ATRASO > 1440 AND FT.ID = 6 THEN 'RIACHUELO > 1440'
        WHEN FT.ATRASO BETWEEN 31 AND 60 AND FT.ID = 10 THEN 'RIACHUELO NOVA\u00c7\u00c3O - 31 A 60'
        WHEN FT.ATRASO BETWEEN 61 AND 90 AND FT.ID = 10 THEN 'RIACHUELO NOVA\u00c7\u00c3O - 61 A 90'
        WHEN FT.ATRASO BETWEEN 91 AND 120 AND FT.ID = 10 THEN 'RIACHUELO NOVA\u00c7\u00c3O - 91 A 120'
        WHEN FT.ATRASO BETWEEN 121 AND 150 AND FT.ID = 10 THEN 'RIACHUELO NOVA\u00c7\u00c3O - 121 A 150'
        WHEN FT.ATRASO BETWEEN 151 AND 180 AND FT.ID = 10 THEN 'RIACHUELO NOVA\u00c7\u00c3O - 151 A 180'
        WHEN FT.ATRASO BETWEEN 181 AND 1440 AND FT.ID = 11 THEN 'RIACHUELO NOVA\u00c7\u00c3O LONGA'
        WHEN FT.ATRASO BETWEEN 91 AND 120 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 91 A 120'
        WHEN FT.ATRASO BETWEEN 121 AND 150 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 121 A 150'
        WHEN FT.ATRASO BETWEEN 151 AND 180 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 151 A 180'
        WHEN FT.ATRASO BETWEEN 181 AND 330 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 181 A 330'
        WHEN FT.ATRASO BETWEEN 331 AND 510 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 331 A 510'
        WHEN FT.ATRASO BETWEEN 511 AND 540 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 511 A 540'
        WHEN FT.ATRASO BETWEEN 541 AND 1080 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 541 A 1080'
        WHEN FT.ATRASO BETWEEN 1081 AND 1440 AND FT.ID = 12 THEN 'RIACHUELO TOPAZ - 1081 A 1440'
        WHEN FT.ATRASO BETWEEN 5 AND 30 AND FT.ID = 13 THEN 'RIACHUELO TOPAZ - 05 A 30'
        WHEN FT.ATRASO BETWEEN 31 AND 60 AND FT.ID = 14 THEN 'RIACHUELO TOPAZ - 31 A 60'
        WHEN FT.ATRASO BETWEEN 61 AND 90 AND FT.ID = 15 THEN 'RIACHUELO TOPAZ - 61 A 90'
    END AS FAIXA_ATRASO
FROM NECTAR.DBO.TB_ANDAMENTO A WITH (NOLOCK)
INNER JOIN NECTAR.DBO.TB_CONTRATO C WITH (NOLOCK)
    ON C.IDCON_CON = A.IDCON_AND
INNER JOIN NECTAR.DBO.TB_DEVEDOR D WITH (NOLOCK)
    ON D.IDDEV_DEV = C.IDDEV_CON
INNER JOIN (
    SELECT
        X.CPF,
        X.IDEMP_CON,
        X.DATA_ACORDO,
        X.[VALOR DO ACORDO]
    FROM (
        SELECT
            D.CGCPF_DEV AS CPF,
            C.IDEMP_CON,
            CAST(A.DTACO_ACO AS DATE) AS DATA_ACORDO,
            CAST(PAG.VLVEN_PAG AS MONEY) AS [VALOR DO ACORDO],
            ROW_NUMBER() OVER (
                PARTITION BY D.CGCPF_DEV, C.IDEMP_CON
                ORDER BY CAST(A.DTACO_ACO AS DATE) DESC, A.IDACO_ACO DESC
            ) AS RN
        FROM NECTAR.DBO.TB_ACORDO A WITH (NOLOCK)
        INNER JOIN NECTAR.DBO.TB_CONTRATO C WITH (NOLOCK)
            ON C.IDCON_CON = A.IDCON_ACO
        INNER JOIN NECTAR.DBO.TB_DEVEDOR D WITH (NOLOCK)
            ON D.IDDEV_DEV = C.IDDEV_CON
        LEFT JOIN NECTAR.DBO.TB_PAGAMENTO PAG WITH (NOLOCK)
            ON PAG.IDACO_PAG = A.IDACO_ACO
        WHERE C.IDEMP_CON IN (6,8,9,10,11,12,13,14,15,17)
          AND PAG.PAGAM_PAG = 1
    ) X
    WHERE X.RN = 1
) ULTIMO_ACORDO
    ON ULTIMO_ACORDO.CPF = D.CGCPF_DEV
   AND ULTIMO_ACORDO.IDEMP_CON = C.IDEMP_CON
LEFT JOIN (
    SELECT
        FT.CPF,
        CAST(FT.DATA_CARTEIRA AS DATE) AS DATA_CARTEIRA,
        FT.ID_EMPRESA AS ID,
        FT.PRODUTO AS PRODUTO,
        MAX(FT.ATUALIZADO) AS ATUALIZADO,
        MAX(FT.PRINCIPAL) AS PRINCIPAL,
        MAX(FT.DIAS_ATRASO_ORIGINAL) AS ATRASO
    FROM SYSCOB.DBO.MIS_TBL_FOTOGRAFIA_CARTEIRA FT WITH (NOLOCK)
    GROUP BY
        FT.PRODUTO,
        FT.CPF,
        CAST(FT.DATA_CARTEIRA AS DATE),
        FT.ID_EMPRESA
) FT
    ON FT.CPF = ULTIMO_ACORDO.CPF
   AND FT.DATA_CARTEIRA = ULTIMO_ACORDO.DATA_ACORDO
   AND FT.ID = ULTIMO_ACORDO.IDEMP_CON
WHERE A.IDOCO_AND IN (944,914)
  AND C.IDEMP_CON IN (6,8,9,10,11,12,13,14,15,17)
GROUP BY
    D.CGCPF_DEV,
    ULTIMO_ACORDO.IDEMP_CON,
    FT.ATUALIZADO,
    FT.PRODUTO,
    FT.PRINCIPAL,
    ULTIMO_ACORDO.[VALOR DO ACORDO],
    FT.ATRASO,
    FT.ID
HAVING
    FT.PRODUTO IS NOT NULL
    AND FT.ATUALIZADO > 0
    AND ULTIMO_ACORDO.[VALOR DO ACORDO] > 0
ORDER BY
    D.CGCPF_DEV,
    ULTIMO_ACORDO.IDEMP_CON;
`;

const statsCache = {
  loadedAt: 0,
  refreshedAt: null,
  rows: [],
  grouped: new Map(),
  lastError: null,
};

let refreshPromise = null;
let refreshIntervalStarted = false;

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizeKeySegment(value) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function normalizeRiachueloProduct(value) {
  const normalized = normalizeKeySegment(value);

  if (!normalized) {
    return "";
  }

  if (
    normalized.includes("BANDEIRA") ||
    normalized.includes("VISA") ||
    normalized.includes("MASTER")
  ) {
    return "BANDEIRA";
  }

  if (
    /\bPL\b/.test(normalized) ||
    normalized.includes("CARTAO PL") ||
    normalized.includes("PRIVATE LABEL") ||
    normalized.includes("CARTAO DA LOJA")
  ) {
    return "PL";
  }

  return normalized;
}

function getSqlServerTarget() {
  const rawHost = String(config.sqlServerHost || "").trim();
  const [serverName, instanceName] = rawHost.split("\\");
  return {
    serverName: serverName || rawHost,
    instanceName: instanceName || "",
  };
}

function createConnectionConfig() {
  const { serverName, instanceName } = getSqlServerTarget();
  const baseConfig = {
    server: serverName,
    options: {
      database: config.sqlServerDatabase,
      trustServerCertificate: true,
      encrypt: false,
      rowCollectionOnRequestCompletion: false,
      useColumnNames: false,
    },
  };

  if (instanceName) {
    baseConfig.options.instanceName = instanceName;
  } else {
    baseConfig.options.port = config.sqlServerPort;
  }

  if (config.sqlServerAuthMode === "ntlm") {
    baseConfig.authentication = {
      type: "ntlm",
      options: {
        domain: config.sqlServerDomain,
        userName: config.sqlServerUser,
        password: config.sqlServerPassword,
      },
    };
    return baseConfig;
  }

  return {
    ...baseConfig,
    authentication: {
      type: "default",
      options: {
        userName: config.sqlServerUser,
        password: config.sqlServerPassword,
      },
    },
  };
}

function runHistoryQuery(queryText) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const connection = new Connection(createConnectionConfig());
    let settled = false;

    const safeResolve = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const safeReject = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    connection.on("connect", (error) => {
      if (error) {
        safeReject(error);
        return;
      }

      const request = new Request(queryText, (requestError) => {
        connection.close();
        if (requestError) {
          safeReject(requestError);
          return;
        }

        safeResolve(rows);
      });

      request.on("row", (columns) => {
        const row = {};

        columns.forEach((column) => {
          row[column.metadata.colName] = column.value;
        });

        rows.push(row);
      });

      connection.execSql(request);
    });

    connection.on("error", (error) => {
      safeReject(error);
    });

    connection.connect();
  });
}

function buildHistoryKey({ idCarteira, faixaAtraso, produtoNormalizado }) {
  return [
    String(toInt(idCarteira)),
    normalizeKeySegment(faixaAtraso),
    normalizeRiachueloProduct(produtoNormalizado),
  ].join("::");
}

function normalizeHistoryRows(rows) {
  return rows
    .map((row) => {
      const idCarteira = toInt(row.ID_CARTEIRA ?? row.CEDENTE);
      const valorAtualizado = toNumber(row.VALOR_ATUALIZADO ?? row.ATUALIZADO);
      const valorAcordo = toNumber(row.VALOR_ACORDO);
      const percentualAceito =
        valorAtualizado > 0 ? roundCurrency(valorAcordo / valorAtualizado) : 0;
      const produto = String(row.PRODUTO || "").trim();
      const faixaAtraso = String(
        row.FAIXA_ATRASO ?? row["FAIXA DE ATRASO"] ?? ""
      ).trim();

      return {
        valorAtualizado,
        valorPrincipal: toNumber(row.VALOR_PRINCIPAL ?? row.PRINCIPAL),
        valorAcordo,
        faixaAtraso,
        idCarteira,
        nomeFantasia:
          String(row.NOME_FANTASIA || "").trim() ||
          RIACHUELO_CARTEIRA_MAP.get(idCarteira) ||
          `ID ${idCarteira}`,
        produto,
        produtoNormalizado: normalizeRiachueloProduct(produto),
        percentualAceito,
      };
    })
    .filter(
      (row) =>
        row.valorAtualizado > 0 &&
        row.valorAcordo > 0 &&
        row.percentualAceito > 0 &&
        row.percentualAceito <= 1 &&
        row.idCarteira > 0 &&
        row.nomeFantasia &&
        row.faixaAtraso &&
        row.produtoNormalizado
    );
}

function buildGroupedStats(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = buildHistoryKey(row);
    const current =
      grouped.get(key) ||
      {
        idCarteira: row.idCarteira,
        nomeFantasia: row.nomeFantasia,
        faixaAtraso: row.faixaAtraso,
        produto: row.produto,
        produtoNormalizado: row.produtoNormalizado,
        sampleSize: 0,
        percentualTotal: 0,
      };

    current.sampleSize += 1;
    current.percentualTotal += row.percentualAceito;
    grouped.set(key, current);
  });

  grouped.forEach((entry, key) => {
    grouped.set(key, {
      ...entry,
      percentualMedio: roundCurrency(entry.percentualTotal / entry.sampleSize),
    });
  });

  return grouped;
}

function findHistoricalMatch({ idCarteira, faixaAtraso, produtoNormalizado }) {
  const exactKey = buildHistoryKey({
    idCarteira,
    faixaAtraso,
    produtoNormalizado,
  });
  const exactStats = statsCache.grouped.get(exactKey);

  if (exactStats && exactStats.sampleSize >= MIN_SAMPLE_SIZE) {
    return {
      stats: exactStats,
      matchStrategy: "produto_exato",
    };
  }

  const faixaNormalizada = normalizeKeySegment(faixaAtraso);
  const produtoAtualNormalizado = normalizeRiachueloProduct(produtoNormalizado);
  const alternativeStats = Array.from(statsCache.grouped.values())
    .filter(
      (entry) =>
        toInt(entry.idCarteira) === toInt(idCarteira) &&
        normalizeKeySegment(entry.faixaAtraso) === faixaNormalizada &&
        entry.produtoNormalizado &&
        entry.produtoNormalizado !== produtoAtualNormalizado &&
        entry.sampleSize >= MIN_SAMPLE_SIZE
    )
    .sort((left, right) => {
      if (right.sampleSize !== left.sampleSize) {
        return right.sampleSize - left.sampleSize;
      }

      return right.percentualMedio - left.percentualMedio;
    })[0];

  if (!alternativeStats) {
    return null;
  }

  return {
    stats: alternativeStats,
    matchStrategy: "produto_alternativo",
  };
}

function buildHistoricalSuggestion({
  idCarteira,
  nomeFantasia,
  faixaAtraso,
  produto,
  produtoNormalizado,
  valorAtualizado,
  stats,
  matchStrategy,
}) {
  const valorSugerido = roundCurrency(stats.percentualMedio * valorAtualizado);

  return {
    idCarteira,
    nomeFantasia,
    faixaAtraso,
    produto,
    produtoNormalizado,
    valorAtualizado,
    valorAtualizadoFormatado: formatCurrencyBR(valorAtualizado),
    percentualMedio: stats.percentualMedio,
    percentualMedioFormatado: `${(stats.percentualMedio * 100).toFixed(2)}%`,
    valorSugerido,
    valorSugeridoFormatado: formatCurrencyBR(valorSugerido),
    sampleSize: stats.sampleSize,
    usedFallback: false,
    fallbackReason: "",
    refreshedAt: statsCache.refreshedAt,
    matchStrategy,
    produtoHistorico: stats.produto,
    produtoHistoricoNormalizado: stats.produtoNormalizado,
    faixaHistorica: stats.faixaAtraso,
  };
}

async function refreshHistoricalData() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (getMissingSqlServerConfig().length > 0) {
      const error = new Error(
        "Configuração do SQL Server incompleta para sugerir contra proposta."
      );
      statsCache.lastError = error;
      throw error;
    }

    const rawRows = await runHistoryQuery(HISTORY_QUERY_V2);
    const normalizedRows = normalizeHistoryRows(rawRows);
    statsCache.rows = normalizedRows;
    statsCache.grouped = buildGroupedStats(normalizedRows);
    statsCache.loadedAt = Date.now();
    statsCache.refreshedAt = new Date().toISOString();
    statsCache.lastError = null;
    return statsCache;
  })();

  try {
    return await refreshPromise;
  } catch (error) {
    statsCache.lastError = error;
    throw error;
  } finally {
    refreshPromise = null;
  }
}

async function ensureHistoricalData() {
  const stale =
    !statsCache.loadedAt || Date.now() - statsCache.loadedAt >= MAX_STALENESS_MS;

  if (statsCache.rows.length === 0 || stale) {
    await refreshHistoricalData();
  }

  return statsCache;
}

function startHistoricalRefreshSchedule() {
  if (refreshIntervalStarted) {
    return;
  }

  refreshIntervalStarted = true;

  refreshHistoricalData().catch(() => {
    // Mantém o painel funcionando mesmo se a primeira carga falhar.
  });

  setInterval(() => {
    refreshHistoricalData().catch(() => {
      // A próxima sugestão tenta novamente sob demanda.
    });
  }, REFRESH_INTERVAL_MS);
}

function resolveCarteiraIdByNomeFantasia(nomeFantasia) {
  return RIACHUELO_NAME_TO_ID.get(normalizeKeySegment(nomeFantasia)) || 0;
}

function resolveRiachueloFaixaAtraso({ nomeFantasia, diasAtraso }) {
  const carteiraId = resolveCarteiraIdByNomeFantasia(nomeFantasia);
  const atraso = toInt(diasAtraso);

  if (atraso < 5) return "01. 0000 A 0004";
  if (atraso >= 5 && atraso <= 15 && carteiraId === 17) return "RIACHUELO - 05 A 15";
  if (atraso >= 16 && atraso <= 30 && [17, 27].includes(carteiraId))
    return "RIACHUELO - 16 A 30";
  if (atraso >= 31 && atraso <= 60 && carteiraId === 9) return "RIACHUELO - 31 A 60";
  if (atraso >= 61 && atraso <= 90 && carteiraId === 8) return "RIACHUELO - 61 A 90";
  if (atraso >= 91 && atraso <= 120 && carteiraId === 6) return "RIACHUELO - 91 A 120";
  if (atraso >= 121 && atraso <= 150 && carteiraId === 6) return "RIACHUELO - 121 A 150";
  if (atraso >= 151 && atraso <= 180 && carteiraId === 6) return "RIACHUELO - 151 A 180";
  if (atraso >= 181 && atraso <= 330 && carteiraId === 6) return "RIACHUELO - 181 A 330";
  if (atraso >= 331 && atraso <= 510 && carteiraId === 6) return "RIACHUELO - 331 A 510";
  if (atraso >= 511 && atraso <= 540 && carteiraId === 6) return "RIACHUELO - 511 A 540";
  if (atraso >= 541 && atraso <= 1080 && carteiraId === 6)
    return "RIACHUELO - 541 A 1080";
  if (atraso >= 1081 && atraso <= 1440 && carteiraId === 6)
    return "RIACHUELO - 1081 A 1440";
  if (atraso > 1440 && carteiraId === 6) return "RIACHUELO > 1440";
  if (atraso >= 31 && atraso <= 60 && carteiraId === 10)
    return "RIACHUELO NOVA\u00c7\u00c3O - 31 A 60";
  if (atraso >= 61 && atraso <= 90 && carteiraId === 10)
    return "RIACHUELO NOVA\u00c7\u00c3O - 61 A 90";
  if (atraso >= 91 && atraso <= 120 && carteiraId === 10)
    return "RIACHUELO NOVA\u00c7\u00c3O - 91 A 120";
  if (atraso >= 121 && atraso <= 150 && carteiraId === 10)
    return "RIACHUELO NOVA\u00c7\u00c3O - 121 A 150";
  if (atraso >= 151 && atraso <= 180 && carteiraId === 10)
    return "RIACHUELO NOVA\u00c7\u00c3O - 151 A 180";
  if (atraso >= 181 && atraso <= 1440 && carteiraId === 11)
    return "RIACHUELO NOVA\u00c7\u00c3O LONGA";
  if (atraso >= 91 && atraso <= 120 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 91 A 120";
  if (atraso >= 121 && atraso <= 150 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 121 A 150";
  if (atraso >= 151 && atraso <= 180 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 151 A 180";
  if (atraso >= 181 && atraso <= 330 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 181 A 330";
  if (atraso >= 331 && atraso <= 510 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 331 A 510";
  if (atraso >= 511 && atraso <= 540 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 511 A 540";
  if (atraso >= 541 && atraso <= 1080 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 541 A 1080";
  if (atraso >= 1081 && atraso <= 1440 && carteiraId === 12)
    return "RIACHUELO TOPAZ - 1081 A 1440";
  if (atraso >= 5 && atraso <= 30 && carteiraId === 13) return "RIACHUELO TOPAZ - 05 A 30";
  if (atraso >= 31 && atraso <= 60 && carteiraId === 14) return "RIACHUELO TOPAZ - 31 A 60";
  if (atraso >= 61 && atraso <= 90 && carteiraId === 15) return "RIACHUELO TOPAZ - 61 A 90";

  return "";
}

function buildFallbackSuggestion({
  idCarteira,
  nomeFantasia,
  faixaAtraso,
  produto,
  produtoNormalizado,
  valorAtualizado,
  fallbackReason,
}) {
  const percentualMedio = roundCurrency(1 - FALLBACK_DISCOUNT_PERCENTAGE);
  const valorSugerido = roundCurrency(valorAtualizado * percentualMedio);

  return {
    idCarteira,
    nomeFantasia,
    faixaAtraso,
    produto,
    produtoNormalizado,
    valorAtualizado,
    valorAtualizadoFormatado: formatCurrencyBR(valorAtualizado),
    percentualMedio,
    percentualMedioFormatado: `${(percentualMedio * 100).toFixed(2)}%`,
    valorSugerido,
    valorSugeridoFormatado: formatCurrencyBR(valorSugerido),
    sampleSize: 0,
    usedFallback: true,
    fallbackReason,
    refreshedAt: statsCache.refreshedAt,
    matchStrategy: "fallback",
    produtoHistorico: "",
    produtoHistoricoNormalizado: "",
    faixaHistorica: faixaAtraso,
  };
}

async function suggestCounterProposal({
  nomeFantasia,
  produto,
  diasAtraso,
  valorAtualizado,
}) {
  const nomeFantasiaNormalizado = String(nomeFantasia || "").trim();
  const idCarteira = resolveCarteiraIdByNomeFantasia(nomeFantasiaNormalizado);
  const produtoOriginal = String(produto || "").trim();
  const produtoNormalizado = normalizeRiachueloProduct(produtoOriginal);
  const valorAtualizadoNormalizado = roundCurrency(toNumber(valorAtualizado));
  const faixaAtraso = resolveRiachueloFaixaAtraso({
    nomeFantasia: nomeFantasiaNormalizado,
    diasAtraso,
  });

  if (
    !nomeFantasiaNormalizado ||
    !idCarteira ||
    !produtoNormalizado ||
    valorAtualizadoNormalizado <= 0
  ) {
    return buildFallbackSuggestion({
      idCarteira,
      nomeFantasia: nomeFantasiaNormalizado,
      faixaAtraso,
      produto: produtoOriginal,
      produtoNormalizado,
      valorAtualizado: valorAtualizadoNormalizado,
      fallbackReason: "Dados insuficientes do cliente para calcular a sugestão.",
    });
  }

  await ensureHistoricalData();

  if (!faixaAtraso) {
    return buildFallbackSuggestion({
      idCarteira,
      nomeFantasia: nomeFantasiaNormalizado,
      faixaAtraso,
      produto: produtoOriginal,
      produtoNormalizado,
      valorAtualizado: valorAtualizadoNormalizado,
      fallbackReason: "Faixa de atraso histórica não identificada para esta carteira.",
    });
  }

  const historicalMatch = findHistoricalMatch({
    idCarteira,
    faixaAtraso,
    produtoNormalizado,
  });

  if (!historicalMatch) {
    return buildFallbackSuggestion({
      idCarteira,
      nomeFantasia: nomeFantasiaNormalizado,
      faixaAtraso,
      produto: produtoOriginal,
      produtoNormalizado,
      valorAtualizado: valorAtualizadoNormalizado,
      fallbackReason: `Base histórica insuficiente para esta combinação (mínimo de ${MIN_SAMPLE_SIZE} casos).`,
    });
  }

  return buildHistoricalSuggestion({
    idCarteira,
    nomeFantasia: nomeFantasiaNormalizado,
    faixaAtraso,
    produto: produtoOriginal,
    produtoNormalizado,
    valorAtualizado: valorAtualizadoNormalizado,
    stats: historicalMatch.stats,
    matchStrategy: historicalMatch.matchStrategy,
  });
}

function getHistoricalRefreshStatus() {
  return {
    loadedAt: statsCache.loadedAt,
    refreshedAt: statsCache.refreshedAt,
    rows: statsCache.rows.length,
    groups: statsCache.grouped.size,
    lastError: statsCache.lastError ? statsCache.lastError.message : null,
  };
}

module.exports = {
  getHistoricalRefreshStatus,
  getMissingSqlServerConfig,
  resolveRiachueloFaixaAtraso,
  startHistoricalRefreshSchedule,
  suggestCounterProposal,
};
