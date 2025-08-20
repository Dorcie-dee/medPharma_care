import { Router } from "express";
import { updateDoctorStatus } from "../controllers/doctorController.js";

const doctorRouter = Router();


doctorRouter.patch("/:id/status", updateDoctorStatus)
export default doctorRouter;