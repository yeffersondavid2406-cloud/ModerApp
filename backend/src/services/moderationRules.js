const STRONG_SPAM_PATTERNS = [
  /gana(?:r)? dinero/i,
  /dinero[\s-]?f[aá]cil/i,
  /compra(?:r)? seguidores/i,
  /ganar seguidores/i,
  /seguidores baratos/i,
  /escr[ií]beme al whatsapp/i,
  /premios? gratis/i,
  /regalan? (?:equipos|dinero|premios)/i,
  /duplica(?:r)? tus ingresos/i
];

const WEAK_SPAM_PATTERNS = [
  /\bofertas?\b/i,
  /\bcup[oó]n(?:es)?\b/i,
  /\bdescuentos?\b/i,
  /%\s*de\s*descuento/i,
  /\bpromoci[oó]n\b/i,
  /\bpublicidad\b/i,
  /\bgratis\b/i,
  /\bwhatsapp\b/i,
  /\bhazte rico\b/i,
  /\bingresos\b/i,
  /\bpremios?\b/i,
  /\bcomprar? ahora\b/i,
  /\bclick aqu[ií]\b/i
];

const PROMO_DOMAIN_PATTERN =
  /\b(?:dinero-facil|ofertas-hoy|ganancias?|promo)[a-z0-9-]*\.[a-z]{2,}\b/i;

const SCAM_QUESTION_PATTERN =
  /\?[^?]*(?:estafa|fraude|scam)[^?]*\?|\b(?:ser[aá]|sera)\s+verdad\b/i;

const OFFENSIVE_PATTERNS = [
  /\bidiota\b/i,
  /\best[uú]pido\b/i,
  /\bignorantes?\b/i,
  /\bimb[eé]cil\b/i,
  /\bpendejo\b/i,
  /\bcabr[oó]n\b/i,
  /\bhijo de puta\b/i
];

const THREAT_PATTERNS = [
  /te voy a encontrar/i,
  /vas a ver lo que te pasa/i,
  /s[eé] d[oó]nde (?:vives|trabajas|est[aá]s)/i,
  /te vas a arrepentir/i,
  /te arrepentir[aá]s/i,
  /te voy a (?:matar|golpear|hacer da[nñ]o)/i,
  /voy a (?:matarte|golpearte|hacerte da[nñ]o)/i
];

export const PHONE_PATTERN =
  /(?:\+?57[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|\b\d{10}\b/;

export const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/i;

function buildResult(category, reason, confidence, signals) {
  return {
    category,
    reason,
    confidence,
    signals,
    method: "rules"
  };
}

export function classifyWithRules(comment) {
  const text = String(comment?.texto ?? "").trim();
  const signals = [];

  function addSignal(signal) {
    if (!signals.includes(signal)) {
      signals.push(signal);
    }
  }

  if (!text) {
    addSignal("vacio");

    return buildResult(
      "revisar",
      "El comentario está vacío; un moderador debe revisarlo.",
      0.95,
      signals
    );
  }

  const hasThreat = THREAT_PATTERNS.some(pattern => pattern.test(text));
  const hasInsult = OFFENSIVE_PATTERNS.some(pattern => pattern.test(text));
  const hasPhone = PHONE_PATTERN.test(text);
  const hasUrl = URL_PATTERN.test(text);
  const isScamQuestion = SCAM_QUESTION_PATTERN.test(text);

  const strongSpam = STRONG_SPAM_PATTERNS.some(pattern => pattern.test(text));
  const weakSpamCount = WEAK_SPAM_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(text) ? 1 : 0),
    0
  );
  const hasPromoDomain = PROMO_DOMAIN_PATTERN.test(text);

  const hasSpam =
    !isScamQuestion &&
    (strongSpam || weakSpamCount >= 2 || hasPromoDomain);

  const reportes = Number(comment?.reportes) || 0;
  const hasManyReports = reportes >= 5;

  if (hasThreat) addSignal("amenaza");
  if (hasInsult) addSignal("insulto");
  if (isScamQuestion) addSignal("posible_estafa");
  if (hasSpam) addSignal("publicidad");
  if (hasPhone) addSignal("dato_personal");
  if (hasUrl) addSignal("enlace_externo");
  if (hasManyReports) addSignal("muchos_reportes");

  if (hasThreat) {
    return buildResult(
      "revisar",
      "Contiene una posible amenaza directa o indirecta.",
      0.95,
      signals
    );
  }

  if (hasInsult) {
    return buildResult(
      "revisar",
      "Contiene lenguaje ofensivo dirigido a otras personas.",
      0.85,
      signals
    );
  }

  if (isScamQuestion) {
    return buildResult(
      "revisar",
      "Pregunta sobre una posible estafa; no se trata como publicidad.",
      0.65,
      signals
    );
  }

  if (hasSpam) {
    return buildResult(
      "spam",
      "Contiene señales de publicidad no solicitada o promoción.",
      0.9,
      signals
    );
  }

  if (hasPhone) {
    return buildResult(
      "revisar",
      "Incluye un número telefónico, que es un dato personal.",
      0.85,
      signals
    );
  }

  if (hasManyReports) {
    return buildResult(
      "revisar",
      "Acumula cinco o más reportes; un moderador debe revisarlo.",
      0.6,
      signals
    );
  }

  if (hasUrl) {
    return buildResult(
      "ok",
      "Contiene un enlace informativo sin señales de spam.",
      0.6,
      signals
    );
  }

  return buildResult(
    "ok",
    "No se detectaron señales de spam, amenazas ni datos personales.",
    0.6,
    signals
  );
}
