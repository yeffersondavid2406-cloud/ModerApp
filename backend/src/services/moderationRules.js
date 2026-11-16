
const spamWords = [
  "gana dinero",
  "duplica tus ingresos",
  "compra ahora",
  "descuento",
  "oferta limitada",
  "sígueme",
  "ganar seguidores",
  "premios gratis"
];

const reviewWords = [
  "inútil",
  "ignorantes",
  "te arrepentirás",
  "te vas a arrepentir",
  "sé dónde trabajas",
  "voy a encontrarte"
];

export function classifyWithRules(comment) {
  const text = comment.texto.toLowerCase();

  if (reviewWords.some(word => text.includes(word))) {
    return {
      category: "revisar",
      reason: "Contiene expresiones ofensivas o posibles amenazas."
    };
  }

  if (/\b\d{10}\b/.test(text)) {
    return {
      category: "revisar",
      reason: "Podría contener información personal, como un número telefónico."
    };
  }

  if (spamWords.some(word => text.includes(word))) {
    return {
      category: "spam",
      reason: "Contiene expresiones asociadas con publicidad o promociones."
    };
  }

  if (comment.reportes >= 5) {
    return {
      category: "revisar",
      reason: "Tiene cinco o más reportes y necesita evaluación humana."
    };
  }

  return {
    category: "ok",
    reason: "No se encontraron señales claras de spam o contenido problemático."
  };
}
