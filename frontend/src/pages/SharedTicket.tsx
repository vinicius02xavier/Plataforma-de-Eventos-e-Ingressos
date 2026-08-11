import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

export function SharedTicket() {
  const { token } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) api(`/shared/tickets/${token}`).then(setTicket).catch(err => setError(err.message));
  }, [token]);

  if (error) return <div className="center-page"><div className="form-card"><h1>Ingresso inválido</h1><p>{error}</p></div></div>;
  if (!ticket) return <div className="center-page">Carregando ingresso...</div>;

  return (
    <div className="center-page">
      <article className="shared-ticket">
        <span className="eyebrow">INGRESSO DIGITAL</span>
        <h1>{ticket.event.title}</h1>
        <p>{new Date(ticket.event.date).toLocaleString("pt-BR")}</p>
        <p>{ticket.event.location}</p>
        <div className="ticket-code">{ticket.code}</div>
        <span className={ticket.usedAt ? "status used" : "status"}>{ticket.usedAt ? "Já utilizado" : "Válido"}</span>
      </article>
    </div>
  );
}
