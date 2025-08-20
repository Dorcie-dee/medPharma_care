import Joi from "joi";

export const appointmentValidator = Joi.object({
  patientName: Joi.string()
  .required()
  .messages({
    "string.empty": "Patient name is required",
    "string.min": "Patient name must be at least 3 characters long",
    "string.max": "Patient name cannot exceed 50 characters"
  }),

  doctorId: Joi.string().required(),

  scheduledTime: Joi.date()
  .min("now")   //allow now and future bookings
  .required()
  .messages({
    "date.base": "Scheduled time must be a valid date",
    "date.min": "Scheduled time must be today or a future date",
    "any.required": "Scheduled time is required"
  })

  // scheduledTime: Joi.date().greater("now").required()
});
