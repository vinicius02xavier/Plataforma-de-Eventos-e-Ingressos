import { useEffect, useState } from "react";
import type { Ticket } from "../types";
import { api } from "../services/api";

export function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  async function loadTickets() {
    const data = await api<Ticket[]>("/tickets");
    setTickets(data);
  }

  useEffect(() => {
    loadTickets().catch(console.error);
  }, []);

  async function cancelTicket(ticket: Ticket) {
    try {
      await api(`/reservations/${ticket.reservationId}/cancel`, { method: "POST" });
      await loadTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível cancelar o ingresso.");
    }
  }

  async function copyShareLink(ticket: Ticket) {
    if (!ticket.shareUrl) return;
    await navigator.clipboard.writeText(ticket.shareUrl);
    alert("Link de compartilhamento copiado.");
  }

  return (
    <div className="section narrow">
      <span className="eyebrow">ÁREA DO CLIENTE</span>
      <h1>Meus ingressos</h1>

      {tickets.length === 0 ? (
        <div className="empty">Você ainda não possui ingressos.</div>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <article className="ticket" key={ticket.id}>
              <div>
                <span className="eyebrow">INGRESSO {ticket.code}</span>
                <h2>{ticket.event.title}</h2>
                <p><small>ID do ingresso: {ticket.id}</small></p>
                <p>{new Date(ticket.event.date).toLocaleString("pt-BR")}</p>
                <p>{ticket.event.location}</p>
                {ticket.seatSelection && ticket.seatSelection.length > 0 && (
                  <p><small>Assentos: {ticket.seatSelection.join(", ")}</small></p>
                )}
                <span className={ticket.usedAt ? "status used" : "status"}>
                  {ticket.usedAt ? "Utilizado" : "Disponível"}
                </span>
              </div>

              <div className="ticket-actions">
                {ticket.qrDataUrl ? (
                  <img
                    className="qr-image"
                    src={ticket.qrDataUrl}
                    alt={`QR Code do ingresso ${ticket.code}`}
                  />
                ) : (
                  <div className="qr-fallback">
                    <strong>{ticket.code}</strong>
                  </div>
                )}

                {!ticket.usedAt && (
                  <button className="danger-button" onClick={() => cancelTicket(ticket)}>
                    Cancelar ingresso
                  </button>
                )}
                <button className="ghost-button" onClick={() => copyShareLink(ticket)}>
                  Compartilhar ingresso
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
