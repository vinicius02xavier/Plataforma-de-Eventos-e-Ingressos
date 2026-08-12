import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Event } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) api<Event>(`/events/${id}`).then(setEvent).catch(console.error);
  }, [id]);

  if (!event) return <div className="center-page">Carregando...</div>;

  async function reserve() {
    if (!user) return navigate("/login");

    try {
      const reservation = await api<any>("/reservations", {
        method: "POST",
        body: JSON.stringify({ eventId: event.id, quantity })
      });
      sessionStorage.setItem(`reservation:${reservation.id}`, JSON.stringify(reservation));
      navigate(`/checkout/${reservation.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao reservar.");
    }
  }

  return (
    <div className="detail-page">
      <div className="detail-image">
        {event.imageUrl && <img src={event.imageUrl} alt="" />}
      </div>

      <div className="detail-content">
        <span className="eyebrow">EVENTO</span>
        <h1>{event.title}</h1>
        <p className="lead">{event.description || "Uma experiência para você viver de perto."}</p>
        <p><small>ID do evento: {event.id}</small></p>

        <div className="facts">
          <div><small>DATA</small><strong>{new Date(event.date).toLocaleString("pt-BR")}</strong></div>
          <div><small>LOCAL</small><strong>{event.location}</strong></div>
          <div><small>VALOR</small><strong>R$ {(event.priceInCents / 100).toFixed(2)}</strong></div>
        </div>

        <div className="purchase-box">
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              max={Math.min(20, event.available)}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
            />
          </label>
          <div>
            <small>Disponíveis</small>
            <strong>{event.available}</strong>
          </div>
          <button className="button" onClick={reserve} disabled={!event.available}>
            Reservar ingresso
          </button>
        </div>

        {message && <div className="alert error">{message}</div>}
      </div>
    </div>
  );
}
