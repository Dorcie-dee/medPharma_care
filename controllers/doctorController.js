import { appointmentModel } from "../models/appointmentModel.js";
import { doctorModel } from "../models/doctorModel.js";
import { io } from "../index.js";  


//doctor arrival status
export const updateDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;       // "on-time" | "running-late" | "on-break"

    //finding doctor
    const doctor = await doctorModel.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    //updating status
    doctor.status = status;
    await doctor.save();

    //handling extra logic
    let note = "";
    if (status === "running-late") {
      note = "Doctor is running late, wait time has increased by 10 minutes";

      //recalculating estimated wait times and notify patients
      const appointments = await appointmentModel.find({
        doctorId: doctor._id,
        status: { $in: ["waiting", "in-progress"] }
      }).sort({ createdAt: 1 });

      appointments.forEach((appt, index) => {
        const newWait = (index * 20) + 10; // 20 min slot + 10 min delay
        io.to(appt._id.toString()).emit("queueUpdate", {
          appointmentId: appt._id,
          newWaitTime: `${newWait} minutes`,
          doctorStatus: status
        });
      });

    } else if (status === "on-break") {
      note = "Doctor is on a break, bookings temporarily paused";

    } else {
      note = "Doctor is on-time";
    }

    //broadcasting doctor status update
    io.emit("doctorStatusUpdate", {
      doctorId: doctor._id,
      status: doctor.status,
      note
    });

    res.status(200).json({
      message: "Doctor status updated",
      doctor,
      note
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};