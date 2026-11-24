export const MAX_BATCH_SIZE = 100;

export function validateComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) {
    return "El comentario debe ser un objeto válido.";
  }

  if (
    comment.usuario !== undefined &&
    typeof comment.usuario !== "string"
  ) {
    return "El usuario debe ser un texto.";
  }

  if (typeof comment.texto !== "string") {
    return "El texto del comentario es obligatorio.";
  }

  if (
    comment.reportes !== undefined &&
    (!Number.isInteger(comment.reportes) || comment.reportes < 0)
  ) {
    return "El número de reportes debe ser un entero positivo.";
  }

  if (
    comment.id !== undefined &&
    !["string", "number"].includes(typeof comment.id)
  ) {
    return "El ID del comentario no es válido.";
  }

  return null;
}

export function validateComments(comments) {
  if (!Array.isArray(comments)) {
    return [{ index: null, id: null, error: "Los comentarios deben ser una lista." }];
  }

  return comments
    .map((comment, index) => {
      const error = validateComment(comment);

      return error
        ? { index, id: comment?.id ?? null, error }
        : null;
    })
    .filter(Boolean);
}
