import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">PULSE<span>.</span></Link>

        <nav>
          <Link to="/">Eventos</Link>
          {user?.role === "CUSTOMER" && <Link to="/meus-ingressos">Meus ingressos</Link>}
          {user?.role === "ORGANIZER" && <Link to="/organizador">Organizador</Link>}
          {user?.role === "GATE" && <Link to="/portaria">Portaria</Link>}
        </nav>

        {user ? (
          <button className="ghost-button" onClick={() => { logout(); navigate("/login"); }}>
            Sair
          </button>
        ) : (
          <Link className="button" to="/login">Entrar</Link>
        )}
      </header>

      <main>{children}</main>

      <footer>
        <span>PULSE — Eventos que viram memória.</span>
        <span>Elite Dev Challenge</span>
      </footer>
    </div>
  );
}
