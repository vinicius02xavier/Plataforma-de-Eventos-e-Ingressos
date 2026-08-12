import { FormEvent, useEffect, useState } from "react";
import type { Event } from "../types";
import { api } from "../services/api";

type Movie = { externalId: string; title: string; description: string; imageUrl?: string; releaseDate?: string; voteAverage?: number; };

export function Organizer() {
  const [events, setEvents] = useState<Event[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    date: "",
    location: "",
    capacity: 50,
    priceInCents: 3500,
    status: "PUBLISHED"
  });
  const [message, setMessage] = useState("");

  async function loadEvents() {
    setEvents(await api<Event[]>("/organizer/events"));
  }

  useEffect(() => { loadEvents().catch(console.error); }, []);

  async function searchMovies() {
    setCatalogMessage("");
    setMovies([]);

    try {
      const result = await api<Movie[]>(`/catalog/movies?q=${encodeURIComponent(query)}`);
      setMovies(result);

      if (result.length === 0) {
        setCatalogMessage("Nenhum filme encontrado para esta busca.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível buscar filmes.";
      setCatalogMessage(message);
    }
  }

  function selectMovie(movie: Movie) {
    setSelectedMovie(movie);

    setForm(prev => ({
      ...prev,
      title: movie.title,
      description: movie.description,
      imageUrl: movie.imageUrl || ""
    }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    try {
      await api("/organizer/events", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          catalogExternalId: selectedMovie?.externalId
        })
      });

      setMessage("Evento criado.");
      setSelectedMovie(null);
      await loadEvents();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Erro."
      );
    }
  }

  return (
    <div className="section">
      <span className="eyebrow">BACKOFFICE</span>
      <h1>Organizador</h1>

      <div className="admin-grid">
        <section className="form-card">
          <h2>Catálogo</h2>
          <div className="inline">
            <input value={query} onChange={e => setQuery(e.target.value)} />
            <button className="ghost-button" onClick={searchMovies}>Buscar</button>
          </div>
          {catalogMessage && <div className="alert">{catalogMessage}</div>}

          <div className="movie-results">
            {movies.map(movie => (
              <button key={movie.externalId} onClick={() => selectMovie(movie)}>
                {movie.imageUrl && (
                  <img
                    src={movie.imageUrl}
                    alt={`Poster de ${movie.title}`}
                  />
                )}

                <div>
                  <strong>{movie.title}</strong>

                  {movie.releaseDate && (
                    <small>
                      {new Date(movie.releaseDate).getFullYear()}
                    </small>
                  )}

                  {typeof movie.voteAverage === "number" && (
                    <small>
                      ⭐ {movie.voteAverage.toFixed(1)}
                    </small>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        <form className="form-card" onSubmit={submit}>
          <h2>Novo evento</h2>
          <label>Título<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Descrição<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
          <label>Imagem<input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></label>
          <label>Data<input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></label>
          <label>Local<input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></label>
          <div className="two">
            <label>Capacidade<input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></label>
            <label>Preço (centavos)<input type="number" value={form.priceInCents} onChange={e => setForm({ ...form, priceInCents: Number(e.target.value) })} /></label>
          </div>
          <button className="button full">Publicar evento</button>
          {message && <div className="alert">{message}</div>}
        </form>
      </div>

      <h2 className="subheading">Meus eventos</h2>
      <div className="simple-list">
        {events.map(event => (
          <div key={event.id}>
            <strong>{event.title}</strong>
            <span>{event.status} · {event.available}/{event.capacity} disponíveis</span>
          </div>
        ))}
      </div>
    </div>
  );
}
