import { appointmentModel } from "../models/appointmentModel.js";
import { doctorModel } from "../models/doctorModel.js";
import { appointmentValidator } from "../validators/appointmentValidator.js"
import { io } from "../index.js";



export const createAppointment = async (req, res) => {
  try {

    const CONSULTATION_DURATION = 20; //in mins

    const { error, value } = appointmentValidator.validate(req.body,
      {
        abortEarly: false,    //shows all errors, not just the first
        stripUnknown: true    //removes fields not defined in my schema
      });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    const { patientName, doctorId, scheduledTime } = value;

    //checking if doctor exists
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(400).json({
        message: "Doctor doesn't exist"
      });
    }

    //handling doctor status
    if (doctor.status === "on-break") {
      //if doctor is on break, don’t assign queue yet
      return res.status(400).json({
        message: "Doctor is currently on a break. Please try again later."
      });
    }

    //counting those waiting in line
    const count = await appointmentModel.countDocuments({
      doctorId,
      status: "waiting"
    });

    //determining automaticate queue number
    const queueNumber = count + 1

    //calculating unforseen doctor delay
    const doctorDelay = doctor.status === "running-late" ? 10 : 0;

    //calculating estimated wait time
    // const estimatedWaitTime =
    // (queueNumber - 1) * CONSULTATION_DURATION + doctorDelay;

    let estimatedWaitTime;
    if (queueNumber === 1) {
      estimatedWaitTime = "Available now, 0";
    } else {
      estimatedWaitTime = `${(queueNumber - 1) * CONSULTATION_DURATION + doctorDelay} minutes`;
    }

    //creating appointment
    const newAppointment = new appointmentModel({
      patientName,
      doctorId,
      scheduledTime,
      queueNumber,
      status: "waiting"
    });

    await newAppointment.save();

    //response
    res.status(201).json({
      message: "Appointment created successfully",
      appointment: {
        id: newAppointment._id,
        patientName,
        doctor: doctor.name,
        queueNumber,
        status: newAppointment.status,
        estimatedWaitTime: `${estimatedWaitTime} minutes`
      }
    })


  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
}



//doctor finishing with a client and calling for the next
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;     // expected: "in-progress" | "done"

    //finding appointment
    const appointment = await appointmentModel.findById(id);
    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    //updating appointment status
    appointment.status = status;
    await appointment.save();

    //if doctor marks appointment as "done"
    if (status === "done") {
      //find next waiting appointment
      const nextPatient = await appointmentModel.findOne({
        doctorId: appointment.doctorId,
        status: "waiting"
      }).sort({ createdAt: 1 });   //earliest booking next


      if (nextPatient) {
        nextPatient.status = "in-progress";
        await nextPatient.save();

        //emitting socket alert to patient
        io.to(nextPatient._id.toString()).emit("turnAlert", {
          message: "It's your turn!",
          appointmentId: nextPatient._id
        });


        //broadcasting queue update to everyone in this doctor's queue
        const allAppointments = await appointmentModel.find({
          doctorId: appointment.doctorId,
          status: { $in: ["waiting", "in-progress"] }
        }).sort({ createdAt: 1 });

        allAppointments.forEach((appt, index) => {
          io.to(appt._id.toString()).emit("queueUpdate", {
            position: index + 1,
            appointmentId: appt._id
          });
        });


        //return here with extra data
        return res.status(200).json({
          message: "Appointment marked done. Queue moved.",
          appointment,
          nextPatient
        });
      }

      //if no next patient, return different message
      return res.status(200).json({
        message: "Appointment marked done. No more patients in queue.",
        appointment
      });
    }

    //only runs for non-"done" updates
    res.status(200).json({
      message: "Appointment status updated",
      appointment
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};



// client status
export const getAppointmentStatus = async (req, res) => {
  try {

    const CONSULTATION_DURATION = 20;

    const { id } = req.params;

    //finding existing appointment
    const existingAppointment = await appointmentModel.findById(id);
    if (!existingAppointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    //finding doctor
    const doctor = await doctorModel.findById(existingAppointment.doctorId);
    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found"
      });
    }

    //checking if doctor is on break
    if (doctor.status === "on-break") {
      return res.status(200).json({
        appointmentId: existingAppointment._id,
        queuePosition: null,
        estimatedWaitTime: null,
        doctorStatus: doctor.status,
        message: "Doctor is currently on a break"
      });
    }

    //finding how many patients are ahead in queue (live)
    const aheadInQueue = await appointmentModel.countDocuments({
      doctorId: doctor._id,
      status: { $in: ["waiting", "in-progress"] },
      // status: "waiting",
      createdAt: { $lt: existingAppointment.createdAt }   //booked before this appointment
    });

    const queuePosition = aheadInQueue + 1;

    //calculating doctor delay
    const doctorDelay = doctor.status === "running-late" ? 10 : 0;

    //calculate estimated wait time
    const estimatedWaitTime =
      (queuePosition - 1) * CONSULTATION_DURATION + doctorDelay;


    //response
    res.status(200).json({
      appointmentId: existingAppointment._id,
      patientName: existingAppointment.patientName,
      doctor: doctor.name,
      queuePosition,
      doctorStatus: doctor.status,
      estimatedWaitTime:
        queuePosition === 1 && doctorDelay === 0
          ? "Available now"
          : `${estimatedWaitTime} minutes`
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//all appointments for a specific dorctor
export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await appointmentModel.find({ doctorId }).sort({
      queuePosition: 1, // so they appear in order
    });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments", error });
  }
};

