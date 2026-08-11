import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("client1@elite.dev");
  const [password, setPassword] = useState("EliteDev@2026");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar.");
    }
  }

  return (
    <div className="center-page">
      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">ACESSO</span>
        <h1>Entrar</h1>
        <p>Use um dos usuários seed para testar cada fluxo.</p>

        <label>E-mail<input value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>

        {error && <div className="alert error">{error}</div>}
        <button className="button full">Continuar</button>

        <div className="demo-users">
          <small>Cliente: client1@elite.dev</small>
          <small>Organizador: organizer@elite.dev</small>
          <small>Portaria: gate@elite.dev</small>
        </div>
      </form>
    </div>
  );
}
