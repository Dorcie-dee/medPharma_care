
# 🏥 Real-Time Appointment Queue System

## 📌 1. Overview

This project implements a **real-time medical appointment booking and queue management system**.

* Patients can **book an appointment** with a doctor.
* Patients can **view their live queue position, wait time, and appointment status**.
* Doctors can **update appointment statuses** (`waiting → in-progress → done`).
* Doctors can also update their own status (`on-time, running-late, on-break`).
* Real-time updates are powered by **Socket.IO**, with a **refresh button fallback** for resilience.

---

## 📌 2. Features

✅ Patient booking form (mobile-friendly)
✅ Real-time queue tracking
✅ Doctor dashboard to update patient & doctor statuses
✅ Fallback API calls when sockets fail
✅ MongoDB persistence

---

## 📌 3. Tech Stack & Architecture

### 🖥️ Frontend

* React.js (mobile-first UI)
* Axios for API calls
* Socket.IO-client for real-time events

### ⚙️ Backend

* Node.js + Express.js
* MongoDB with Mongoose
* Socket.IO for real-time updates
* REST API endpoints for fallback & CRUD

### 🏗️ Architecture

* **Patient → Backend (API & Socket) → DB**
* **Doctor → Backend (API & Socket) → DB**
* **Backend → Broadcasts → Patient clients**

---

## 📌 4. How It Works

### Patient Flow

1. Patient books an appointment via `BookingForm`.
2. Appointment is stored in DB and assigned queue number.
3. Patient UI (`StatusView`) listens via Socket.IO for real-time updates.
4. If sockets fail, **Refresh** button calls REST API (`/appointments/:id/status`).

### Doctor Flow

1. Doctor logs in to dashboard.
2. Can update:

   * Appointment status → emits event to patient.
   * Doctor status → emits event to all patients.
3. Patients see immediate updates.

---

## 📌 5. API Documentation

### Appointment Routes

**POST** `/api/appointments`
Book an appointment.

```json
Request:
{
  "patientName": "John Doe",
  "doctorId": "dr_1",
  "scheduledTime": "2025-08-22T10:00:00Z"
}

Response:
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "68a77e34dc22e9ef995326a8",
    "patientName": "John Doe",
    "doctor": "Dr. Michael Chen",
    "queueNumber": 2,
    "status": "waiting",
    "estimatedWaitTime": "20 minutes"
  }
}
```

**GET** `/api/appointments/:id/status`
Get live status for a patient.

```json
Response:
{
  "appointmentId": "68a77e34dc22e9ef995326a8",
  "patientName": "John Doe",
  "doctor": "Dr. Michael Chen",
  "queuePosition": 2,
  "doctorStatus": "on-time",
  "estimatedWaitTime": "20 minutes"
}
```

**PATCH** `/api/appointments/:id/status`
Doctor updates patient appointment.

```json
Request:
{ "status": "in-progress" }
```

---

### Doctor Routes

**PATCH** `/api/doctors/:id/status`
Update doctor status.

```json
Request:
{ "status": "running-late" }

Response:
{ "message": "Doctor status updated", "status": "running-late" }
```

---

### Socket.IO Events

**Patient Listens to:**

* `statusUpdate` → `{ appointmentId, status }`
* `queueUpdate` → `{ appointmentId, position, estimatedWaitTime }`
* `doctorStatusUpdate` → `{ doctorId, status }`

**Doctor Emits:**

* `updateAppointmentStatus`
* `updateDoctorStatus`

---

## 📌 6. Trade-offs & Assumptions

* Consultation time is fixed at **20 minutes per patient**.
* Patients are queued by **booking order**.
* Doctor status (`running-late` adds +10 mins, `on-break` suspends queue).
* No authentication implemented (for demo simplicity).

---

## 📌 7. Bonus Ideas (Future Work)

* SMS / Email **turn alerts** for patients.
* Queue cancellation or rescheduling.
* Multi-doctor scheduling integration.


