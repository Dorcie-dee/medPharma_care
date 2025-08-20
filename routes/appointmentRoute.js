import { Router } from "express";
import { createAppointment, getAppointmentStatus, updateAppointmentStatus } from "../controllers/appointmentController.js";


const appointmentRouter = Router();

appointmentRouter.post("/", createAppointment);

//patient live update
appointmentRouter.get("/:id/status", getAppointmentStatus);

//doctor's live appointment update
appointmentRouter.patch("/:id/status", updateAppointmentStatus)


export default appointmentRouter;

















// socket.emit("joinAppointment", appointmentId);

// Listen for turn alert
// socket.on("turnAlert", (data) => {
//   console.log("🚨 Alert:", data.message);
// });

// Listen for queue updates
// socket.on("queueUpdate", (data) => {
//   console.log("📌 Queue update:", data);
// });
