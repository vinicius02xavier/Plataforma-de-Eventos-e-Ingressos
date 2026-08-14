import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Event } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) api<Event>(`/events/${id}`).then(setEvent).catch(console.error);
  }, [id]);

  const occupiedSeats = useMemo(() => new Set(event?.occupiedSeats ?? []), [event]);

  const seats = useMemo(() => {
    if (!event) return [];
    const seatCount = Math.max(12, Math.min(event.capacity || 12, 80));
    const rowCount = Math.ceil(seatCount / 8);
    const list: string[] = [];

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const row = seatRows[rowIndex] || `R${rowIndex + 1}`;
      for (let col = 1; col <= 8; col++) {
        const seatNumber = `${row}${col}`;
        if (list.length >= seatCount) break;
        list.push(seatNumber);
      }
    }

    return list;
  }, [event]);

  useEffect(() => {
    if (selectedSeats.length > quantity) {
      setSelectedSeats(selectedSeats.slice(0, quantity));
    }
  }, [quantity, selectedSeats]);

  if (!event) return <div className="center-page">Carregando...</div>;

  async function reserve() {
    if (!user) return navigate("/login");
    if (!event) return;

    const finalQuantity = selectedSeats.length || quantity;
    if (finalQuantity < 1) {
      setMessage("Escolha pelo menos um assento ou quantidade válida.");
      return;
    }

    try {
      const reservation = await api<any>("/reservations", {
        method: "POST",
        body: JSON.stringify({
          eventId: event.id,
          quantity: finalQuantity,
          seatSelection: selectedSeats.length ? selectedSeats : undefined
        })
      });
      sessionStorage.setItem(`reservation:${reservation.id}`, JSON.stringify(reservation));
      navigate(`/checkout/${reservation.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erro ao reservar.");
    }
  }

  function toggleSeat(seat: string) {
    if (!event) return;
    if (event.available <= 0) return;
    if (occupiedSeats.has(seat)) return;

    setSelectedSeats((current) => {
      const exists = current.includes(seat);
      if (exists) return current.filter(item => item !== seat);
      if (current.length >= quantity) return current;
      return [...current, seat];
    });
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
              onChange={e => setQuantity(Math.min(Number(e.target.value) || 1, Math.min(20, event.available)))}
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

        <div className="seat-panel">
          <div className="seat-panel-header">
            <div>
              <small>MAPA DE ASSENTOS</small>
              <strong>{selectedSeats.length ? `${selectedSeats.length} assento(s) selecionado(s)` : "Selecione seus assentos"}</strong>
            </div>
            <span>Janela de palco</span>
          </div>

          <div className="seat-map">
            {seats.map((seat) => {
              const isSelected = selectedSeats.includes(seat);
              const isOccupied = occupiedSeats.has(seat);
              return (
                <button
                  key={seat}
                  type="button"
                  className={`seat ${isSelected ? "selected" : ""} ${isOccupied ? "occupied" : ""}`}
                  onClick={() => toggleSeat(seat)}
                  aria-label={`Assento ${seat}`}
                  disabled={isOccupied || (selectedSeats.length >= quantity && !isSelected)}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        </div>

        {message && <div className="alert error">{message}</div>}
      </div>
    </div>
  );
}
