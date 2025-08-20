import express from "express";
import mongoose from "mongoose";
import cors from "cors"
import appointmentRouter from "./routes/appointmentRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import http from "http";
import { Server } from "socket.io";


//database connection
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully.");

    //listening for incoming request
    app.listen(port, () => {
      console.log(`Server listening attentively`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);   //exit process if DB connection fails
  }
})();

//create an express app
const app = express();
const port = process.env.PORT || 5000;

//global middlewares
app.use(cors());
app.use(express.json());

//use routes
app.use("/api/appointments", appointmentRouter);
app.use("/api/doctors", doctorRouter);


//create HTTP server
const server = http.createServer(app);

//setting up Socket.io
export const io = new Server(server, {
  cors: { origin: "*" },   // for testing, allow all origins
  methods: ["GET", "POST", "PATCH"]
});

//listening for client connections
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  //client will join their appointment room
  socket.on("joinAppointment", (appointmentId) => {
    socket.join(appointmentId);
    console.log(`📌 Patient joined room: ${appointmentId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});