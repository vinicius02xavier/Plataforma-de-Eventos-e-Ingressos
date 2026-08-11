import { Link } from "react-router-dom";
import type { Event } from "../types";

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="event-card">
      {event.imageUrl ? (
        <img src={event.imageUrl} alt="" />
      ) : (
        <div className="image-placeholder">EVENTO</div>
      )}

      <div className="event-card-content">
        <div className="eyebrow">{new Date(event.date).toLocaleDateString("pt-BR")}</div>
        <h3>{event.title}</h3>
        <p>{event.location}</p>
        <div className="event-card-bottom">
          <strong>R$ {(event.priceInCents / 100).toFixed(2)}</strong>
          <Link to={`/eventos/${event.id}`}>Ver evento →</Link>
        </div>
      </div>
    </article>
  );
}
