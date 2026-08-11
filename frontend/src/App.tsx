import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { EventDetails } from "./pages/EventDetails";
import { Checkout } from "./pages/Checkout";
import { MyTickets } from "./pages/MyTickets";
import { Organizer } from "./pages/Organizer";
import { Gate } from "./pages/Gate";
import { SharedTicket } from "./pages/SharedTicket";

function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/eventos/:id" element={<EventDetails />} />
        <Route path="/checkout/:id" element={<Protected roles={["CUSTOMER"]}><Checkout /></Protected>} />
        <Route path="/meus-ingressos" element={<Protected roles={["CUSTOMER"]}><MyTickets /></Protected>} />
        <Route path="/organizador" element={<Protected roles={["ORGANIZER"]}><Organizer /></Protected>} />
        <Route path="/portaria" element={<Protected roles={["GATE"]}><Gate /></Protected>} />
        <Route path="/ingresso/:token" element={<SharedTicket />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
