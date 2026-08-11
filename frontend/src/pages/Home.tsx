import { useEffect, useState } from "react";
import type { Event } from "../types";
import { api } from "../services/api";
import { EventCard } from "../components/EventCard";

export function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<Event[]>("/events").then(setEvents).catch(console.error);
  }, []);

  const filtered = events.filter(event =>
    `${event.title} ${event.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <section className="hero">
        <div>
          <span className="eyebrow">AGENDA ABERTA</span>
          <h1>Encontre o próximo evento que vale a pena.</h1>
          <p>Shows, cinema e experiências em um único lugar.</p>
        </div>
        <div className="hero-mark">P.</div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORAR</span>
            <h2>Eventos publicados</h2>
          </div>
          <input
            className="search"
            placeholder="Buscar evento ou local..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {filtered.length ? (
          <div className="event-grid">
            {filtered.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className="empty">Nenhum evento encontrado.</div>
        )}
      </section>
    </div>
  );
}
