import { model, Schema } from "mongoose";
import normalize from "normalize-mongoose";


const doctorSchema = new Schema({
  _id: { type: String, required: true },

  name: { type: String, required: true },

  specialisation: { type: String },

  status: {
    type: String,
    enum: ["on-time", "running-late", "on-break"],
    default: "on-time"
  },

  averageConsultationTime: {
    type: Number,
    default: 20
  } //20mins

},
  { timestamps: true }
);


doctorSchema.plugin(normalize)

export const doctorModel = model('Doctor', doctorSchema);