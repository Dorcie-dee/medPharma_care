import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";


const appointmentSchema = new Schema({
  patientName: {
    type: String,
    required: true
  },

  doctorId: {
    type: String,
    ref: "Doctor",
    required: true
  },

  queueNumber: { type: Number }, //will be assigned when appointment is created

  status: {
    type: String,
    enum: ["waiting", "in-progress", "done"],
    default: "waiting"
  },

  scheduledTime: { type: Date },

},

  { timestamps: true },
);


appointmentSchema.plugin(normalize);

export const appointmentModel = model("Appointment", appointmentSchema);
