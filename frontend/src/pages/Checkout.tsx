import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

type Reservation = {
  id: string;
  quantity: number;
  totalInCents: number;
  status: string;
  event: { title: string; date: string; location: string };
};

export function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");

  // A API não possui GET de reserva intencionalmente; usamos os dados devolvidos
  // pelo fluxo de reserva em produção. Para permitir refresh durante avaliação,
  // este estado pode ser persistido pelo candidato.
  useEffect(() => {
    const raw = sessionStorage.getItem(`reservation:${id}`);
    if (raw) setReservation(JSON.parse(raw));
  }, [id]);

  async function pay(approved: boolean) {
    if (!id) return;
    try {
      await api(`/reservations/${id}/pay`, {
        method: "POST",
        body: JSON.stringify({ approved })
      });

      if (approved) navigate("/meus-ingressos");
      else navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no pagamento.");
    }
  }

  if (!reservation) {
    return (
      <div className="center-page">
        <div className="form-card">
          <h2>Checkout</h2>
          <p>A reserva não está disponível nesta sessão.</p>
          <p className="muted">Se você acabou de reservar, mantenha a mesma aba aberta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="form-card">
        <span className="eyebrow">CHECKOUT</span>
        <h1>{reservation.event.title}</h1>
        <p>{reservation.quantity} ingresso(s)</p>
        <div className="total">R$ {(reservation.totalInCents / 100).toFixed(2)}</div>

        <div className="payment-options">
          <button className="button full" onClick={() => pay(true)}>Aprovar pagamento</button>
          <button className="danger-button full" onClick={() => pay(false)}>Recusar pagamento</button>
        </div>

        {error && <div className="alert error">{error}</div>}
      </div>
    </div>
  );
}
