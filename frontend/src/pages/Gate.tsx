import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";

type Validation = {
  status: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";
  message: string;
};

export function Gate() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [code, setCode] = useState("");
  const [eventId, setEventId] = useState("");
  const [result, setResult] = useState<Validation | null>(null);

  async function validate(token?: string) {
    const data = await api<Validation>("/gate/validate", {
      method: "POST",
      body: JSON.stringify({ token, code: token ? undefined : code, eventId })
    });
    setResult(data);
  }

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async decoded => {
        await scanner.stop().catch(() => undefined);
        await validate(decoded).catch(err => setResult({ status: "INVALID", message: err.message }));
      },
      () => undefined
    ).catch(() => undefined);

    return () => {
      scanner.stop().catch(() => undefined);
    };
  }, [eventId]);

  const className = result ? `validation ${result.status.toLowerCase()}` : "validation";

  return (
    <div className="section gate-page">
      <span className="eyebrow">CONTROLE DE ACESSO</span>
      <h1>Portaria</h1>
      <p>Informe o evento e escaneie o QR. A digitação manual fica disponível como alternativa.</p>

      <div className="gate-grid">
        <div className="form-card">
          <label>ID do evento<input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="Cole o ID do evento" /></label>
          <div id="qr-reader" className="qr-reader" />

          <div className="separator">OU</div>

          <label>Código do ingresso<input value={code} onChange={e => setCode(e.target.value)} placeholder="ED-..." /></label>
          <button className="button full" onClick={() => validate()}>Validar código</button>
        </div>

        <div className={className}>
          {!result ? (
            <><span>AGUARDANDO</span><strong>Pronto para validar.</strong></>
          ) : (
            <><span>{result.status}</span><strong>{result.message}</strong></>
          )}
        </div>
      </div>
    </div>
  );
}
