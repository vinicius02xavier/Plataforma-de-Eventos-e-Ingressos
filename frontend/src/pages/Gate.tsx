import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";
import type { Event } from "../types";

type Validation = {
  status: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
  message: string;
};

export function Gate() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerElementRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const [code, setCode] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [eventId, setEventId] = useState("");
  const [result, setResult] = useState<Validation | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);

  async function stopScanner() {
    const container = scannerElementRef.current ?? document.getElementById(scannerIdRef.current);
    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
    } catch {
      // Ignora stop() quando o scanner ainda não iniciou ou já foi finalizado.
    }

    try {
      await scannerRef.current.clear();
    } catch {
      // Ignora clear() quando a instância não está ativa.
    }

    scannerRef.current = null;
  }

  async function validate(token?: string) {
    const trimmedEventId = eventId.trim();

    if (!trimmedEventId) {
      setResult({
        status: "INVALID",
        message: "Informe o ID do evento para validar o ingresso."
      });
      return;
    }

    const payload = {
      token,
      code: token ? undefined : code.trim() || undefined,
      ticketId: token ? undefined : ticketId.trim() || undefined,
      eventId: trimmedEventId
    };

    const data = await api<Validation>("/gate/validate", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setResult(data);
  }

  useEffect(() => {
    api<Event[]>("/events")
      .then(events => setActiveEvents(events.filter(event => event.status === "PUBLISHED")))
      .catch(() => setActiveEvents([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (startedRef.current) return;
    startedRef.current = true;

    const startScanner = async () => {
      try {
        const element = scannerElementRef.current ?? document.getElementById(scannerIdRef.current);
        if (!element) return;

        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        await stopScanner();

        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async decoded => {
            try {
              await stopScanner();
              await validate(decoded);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Falha ao validar o ingresso.";
              setResult({ status: "INVALID", message });
            }
          },
          () => undefined
        );
        setCameraError("");
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Câmera indisponível.";
          setCameraError(`Leitura de QR indisponível: ${message}`);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      startedRef.current = false;
      void stopScanner();
    };
  }, []);

  const className = result ? `validation ${result.status.toLowerCase()}` : "validation";

  return (
    <div className="section gate-page">
      <span className="eyebrow">CONTROLE DE ACESSO</span>
      <h1>Portaria</h1>
      <p>Informe o evento e escaneie o QR. A digitação manual fica disponível como alternativa.</p>

      <div className="gate-grid">
        <div className="form-card">
          <label>ID do evento<input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="Cole o ID do evento" /></label>

          <div ref={scannerElementRef} id={scannerIdRef.current} className="qr-reader" />
          {cameraError && <div className="alert">{cameraError}</div>}

          <div className="separator">OU</div>

          <label>ID do ingresso<input value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="Cole o ID do ingresso" /></label>
          <label>Código do ingresso<input value={code} onChange={e => setCode(e.target.value)} placeholder="ED-..." /></label>
          <button className="button full" onClick={() => validate()}>Validar ingresso</button>
        </div>

        <div>
          <div className={className}>
            {!result ? (
              <><span>AGUARDANDO</span><strong>Pronto para validar.</strong></>
            ) : (
              <><span>{result.status}</span><strong>{result.message}</strong></>
            )}
          </div>

          {activeEvents.length > 0 && (
            <div className="event-id-card">
              <h3>Eventos ativos</h3>
              <div className="event-id-list">
                {activeEvents.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    className="event-id-chip"
                    onClick={() => setEventId(event.id)}
                  >
                    <span>{event.title}</span>
                    <small>{event.id}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
