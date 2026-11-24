
const spamPatterns = [
  /gana dinero/i,
  /duplica tus ingresos/i,
  /compra ahora/i,
  /descuento del \d+/i,
  /oferta limitada/i,
  /compra seguidores/i,
  /ganar seguidores/i,
  /premios gratis/i,
  /escr[ií]beme al whatsapp/i,
  /dinero f[aá]cil/i
];

const offensivePatterns = [
  /\bidiota\b/i,
  /\best[uú]pido\b/i,
  /\bignorantes\b/i,
  /\bin[uú]til\b/i,
  /\bimb[eé]cil\b/i
];

const threatPatterns = [
  /te voy a encontrar/i,
  /vas a ver lo que te pasa/i,
  /s[eé] d[oó]nde trabajas/i,
  /te vas a arrepentir/i,
  /te arrepentir[aá]s/i
];

const phonePattern = /(?:\+?57[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|\b\d{10}\b/;

const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/i;

export function classifyWithRules(comment) {
  const text = String(comment.texto || "").trim();

  const signals = [];

  if (!text) {
    signals.push({
      type: "empty",
      description: "El comentario está vacío."
    });
  }

  if (spamPatterns.some(pattern => pattern.test(text))) {
    signals.push({
      type: "possible_spam",
      description: "Contiene expresiones asociadas con promociones o publicidad."
    });
  }

  if (offensivePatterns.some(pattern => pattern.test(text))) {
    signals.push({
      type: "offensive_language",
      description: "Contiene posibles expresiones ofensivas."
    });
  }

  if (threatPatterns.some(pattern => pattern.test(text))) {
    signals.push({
      type: "possible_threat",
      description: "Contiene expresiones que podrían representar una amenaza."
    });
  }

  if (phonePattern.test(text)) {
    signals.push({
      type: "personal_information",
      description: "Podría contener un número telefónico."
    });
  }

  if (urlPattern.test(text)) {
    signals.push({
      type: "external_link",
      description: "Contiene un enlace externo."
    });
  }

  if (Number(comment.reportes) >= 5) {
    signals.push({
      type: "high_reports",
      description: "El comentario tiene cinco o más reportes."
    });
  }

  return {
    signals,
    hasSignals: signals.length > 0
  };
}
