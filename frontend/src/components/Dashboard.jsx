import { useEffect, useMemo, useState } from "react";
import { getComments } from "../services/api";

const CATEGORY_LABELS = {
  ok: "Legítimo",
  spam: "Spam",
  revisar: "Revisar"
};

const METHOD_LABELS = {
  ai: "IA",
  rules: "Reglas",
  rules_fallback: "Reglas"
};

const SIGNAL_LABELS = {
  vacio: "vacío",
  amenaza: "amenaza",
  insulto: "insulto",
  posible_estafa: "posible estafa",
  publicidad: "publicidad",
  dato_personal: "dato personal",
  enlace_externo: "enlace externo",
  muchos_reportes: "muchos reportes"
};

function getModeration(comment) {
  return comment.moderacion || {
    category: "revisar",
    reason: "No se recibió información de clasificación.",
    confidence: 0,
    signals: [],
    method: "rules"
  };
}

function Dashboard() {
  const [comments, setComments] = useState([]);
  const [meta, setMeta] = useState({
    aiEnabled: false,
    model: "",
    usedAI: false,
    fallbacks: 0
  });
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComments() {
      try {
        const data = await getComments();

        setComments(
          data.comments.map(comment => ({
            ...comment,
            revisado: false
          }))
        );

        setMeta(data.meta || {});
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los comentarios.");
      } finally {
        setLoading(false);
      }
    }

    loadComments();
  }, []);

  function markAsReviewed(id) {
    setComments(previous =>
      previous.map(comment =>
        comment.id === id
          ? { ...comment, revisado: !comment.revisado }
          : comment
      )
    );
  }

  const counts = useMemo(() => {
    return comments.reduce(
      (accumulator, comment) => {
        const category = getModeration(comment).category;

        if (category in accumulator) {
          accumulator[category]++;
        }

        return accumulator;
      },
      {
        ok: 0,
        spam: 0,
        revisar: 0
      }
    );
  }, [comments]);

  const filteredComments = comments.filter(comment => {
    const moderation = getModeration(comment);

    const matchesCategory =
      filter === "todos" || moderation.category === filter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      String(comment.usuario || "").toLowerCase().includes(searchText) ||
      String(comment.texto || "").toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="loading">Cargando comentarios...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>ModerApp</h1>
          <p>Centro inteligente de moderación de comentarios</p>
        </div>
        <span>{comments.length} comentarios analizados</span>
      </header>

      {!meta.aiEnabled && (
        <div className="ai-banner warning">
          <strong>IA no configurada.</strong> Se está usando el clasificador
          por reglas. Configura <code>GEMINI_API_KEY</code> en{" "}
          <code>backend/.env</code> para activar Gemini.
        </div>
      )}

      {meta.aiEnabled && meta.fallbacks > 0 && (
        <div className="ai-banner warning">
          <strong>Respaldo activo.</strong> {meta.fallbacks} comentario(s) no
          se pudieron clasificar con IA y se usaron las reglas.
        </div>
      )}

      {meta.aiEnabled && meta.usedAI && meta.fallbacks === 0 && (
        <div className="ai-banner info">
          <strong>Gemini activo.</strong> Clasificación realizada con{" "}
          {meta.model || "el modelo configurado"}.
        </div>
      )}

      <section className="stats">
        <article className="stat-card">
          <h3>Total de comentarios</h3>
          <strong>{comments.length}</strong>
          <small>Comentarios registrados</small>
        </article>

        <article className="stat-card">
          <h3>Legítimos</h3>
          <strong>{counts.ok}</strong>
          <small>Contenido permitido</small>
        </article>

        <article className="stat-card">
          <h3>Spam</h3>
          <strong>{counts.spam}</strong>
          <small>Contenido no deseado</small>
        </article>

        <article className="stat-card">
          <h3>Por revisar</h3>
          <strong>{counts.revisar}</strong>
          <small>Requieren evaluación</small>
        </article>
      </section>

      <section className="comments-section">
        <div className="section-heading">
          <div>
            <h2>Gestión de comentarios</h2>
            <p>Consulta y filtra los comentarios recibidos.</p>
          </div>
          <span className="results-count">
            {filteredComments.length} resultados
          </span>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por usuario o contenido..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          {[
            { value: "todos", label: "Todos" },
            { value: "ok", label: "Legítimos" },
            { value: "spam", label: "Spam" },
            { value: "revisar", label: "Revisar" }
          ].map(category => (
            <button
              key={category.value}
              className={filter === category.value ? "active" : ""}
              onClick={() => setFilter(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="comments-list">
          {filteredComments.map(comment => {
            const moderation = getModeration(comment);

            return (
              <article
                className={`comment-card ${comment.revisado ? "reviewed" : ""}`}
                key={comment.id}
              >
                <div className="comment-top">
                  <div>
                    <strong>@{comment.usuario || "usuario_desconocido"}</strong>
                    <small>
                      Comentario #{comment.id} · {comment.reportes} reportes
                    </small>
                  </div>

                  <div className="comment-badges">
                    <span className={`category ${moderation.category}`}>
                      {CATEGORY_LABELS[moderation.category] || "Revisar"}
                    </span>
                    <span className={`method-badge ${moderation.method}`}>
                      {METHOD_LABELS[moderation.method] || "Reglas"}
                    </span>
                    <span className="confidence">
                      {Math.round(Number(moderation.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <p className="comment-text">
                  {comment.texto || "Sin contenido."}
                </p>

                <div className="reason">
                  <strong>Motivo de clasificación:</strong>
                  <span>{moderation.reason}</span>
                </div>

                {moderation.signals?.length > 0 && (
                  <div className="signals">
                    {moderation.signals.map(signal => (
                      <span className="signal-chip" key={signal}>
                        {SIGNAL_LABELS[signal] || signal}
                      </span>
                    ))}
                  </div>
                )}

                <div className="comment-actions">
                  <button
                    className={
                      comment.revisado
                        ? "reviewed-button"
                        : "review-button"
                    }
                    onClick={() => markAsReviewed(comment.id)}
                  >
                    {comment.revisado ? "✓ Revisado" : "Marcar como revisado"}
                  </button>
                </div>
              </article>
            );
          })}

          {filteredComments.length === 0 && (
            <div className="empty-state">
              <h3>No se encontraron comentarios</h3>
              <p>Prueba con otra búsqueda o categoría.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="dashboard-footer">
        ModerApp · Sistema de moderación de comentarios
      </footer>
    </main>
  );
}

export default Dashboard;
