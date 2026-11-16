
import { useEffect, useState } from "react";
import { getComments } from "../services/api";

function Dashboard() {
  const [comments, setComments] = useState([]);
  const [counts, setCounts] = useState({
    ok: 0,
    spam: 0,
    revisar: 0
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

        setCounts(data.counts);
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

  const filteredComments = comments.filter(comment => {
    const matchesCategory =
      filter === "todos" ||
      comment.moderacion.category === filter;

    const searchText = search.toLowerCase();

    const matchesSearch =
      comment.usuario.toLowerCase().includes(searchText) ||
      comment.texto.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="loading">Cargando comentarios...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>ModerApp</h1>
          <p>Centro inteligente de moderación de comentarios</p>
        </div>
        <span>{comments.length} comentarios analizados</span>
      </header>

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
          {filteredComments.map(comment => (
            <article
              className={`comment-card ${comment.revisado ? "reviewed" : ""}`}
              key={comment.id}
            >
              <div className="comment-top">
                <div>
                  <strong>@{comment.usuario}</strong>
                  <small>
                    Comentario #{comment.id} · {comment.reportes} reportes
                  </small>
                </div>

                <span className={`category ${comment.moderacion.category}`}>
                  {comment.moderacion.category === "ok"
                    ? "Legítimo"
                    : comment.moderacion.category === "spam"
                    ? "Spam"
                    : "Revisar"}
                </span>
              </div>

              <p>{comment.texto}</p>

              <div className="reason">
                <strong>Motivo de clasificación:</strong>
                <span>{comment.moderacion.reason}</span>
              </div>

              <div className="comment-actions">
                <button
                  className={comment.revisado ? "reviewed-button" : "review-button"}
                  onClick={() => markAsReviewed(comment.id)}
                >
                  {comment.revisado ? "✓ Revisado" : "Marcar como revisado"}
                </button>
              </div>
            </article>
          ))}

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
