import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyComments } from "../services/moderationService.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const commentsPath = path.resolve(
  currentDirectory,
  "../../data/comentarios.json"
);

export async function getComments(req, res) {
  try {
    const fileContent = await readFile(commentsPath, "utf-8");
    const comments = JSON.parse(fileContent);

    if (!Array.isArray(comments)) {
      throw new Error("El archivo de comentarios no contiene una lista.");
    }

    const { results, meta } = await classifyComments(comments);

    const counts = {
      ok: 0,
      spam: 0,
      revisar: 0
    };

    for (const comment of results) {
      const category = comment.moderacion?.category;

      if (category && category in counts) {
        counts[category]++;
      }
    }

    return res.json({
      success: true,
      total: results.length,
      counts,
      meta,
      comments: results
    });
  } catch (error) {
    console.error("Error al obtener comentarios:", error);

    return res.status(500).json({
      success: false,
      message: "No fue posible obtener los comentarios.",
      error: process.env.NODE_ENV === "development"
        ? error.message
        : undefined
    });
  }
}
