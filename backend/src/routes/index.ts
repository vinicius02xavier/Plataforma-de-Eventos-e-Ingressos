import { Router } from "express";
import { login } from "../controllers/auth.controller";
import { catalogStatus, movies } from "../controllers/catalog.controller";
import { createEvent, getEvent, listEvents, myEvents } from "../controllers/event.controller";
import { myTickets, pay, reserve, sharedTicket, validateTicket } from "../controllers/reservation.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const router = Router();

router.post("/auth/login", login);

router.get("/catalog/movies", requireAuth, requireRole("ORGANIZER"), movies);
router.get("/catalog/status", requireAuth, requireRole("ORGANIZER"), catalogStatus);

router.get("/events", listEvents);
router.get("/events/:id", getEvent);
router.get("/organizer/events", requireAuth, requireRole("ORGANIZER"), myEvents);
router.post("/organizer/events", requireAuth, requireRole("ORGANIZER"), createEvent);

router.post("/reservations", requireAuth, requireRole("CUSTOMER"), reserve);
router.post("/reservations/:id/pay", requireAuth, requireRole("CUSTOMER"), pay);
router.get("/tickets", requireAuth, requireRole("CUSTOMER"), myTickets);

router.get("/shared/tickets/:token", sharedTicket);
router.post("/gate/validate", requireAuth, requireRole("GATE"), validateTicket);
