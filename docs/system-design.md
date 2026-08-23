# MediSlot System Design

## 1. Double-Booking Prevention
The core scheduling problem is preventing two users from claiming the same time slot concurrently.
We define a canonical slot constraint directly in PostgreSQL rather than relying solely on application-level logic.

**Implementation:**
- The `Appointment` table uses a composite unique constraint: `@@unique([doctorId, startTime])`.
- When a booking request arrives, a database transaction is started.
- The system attempts an `INSERT` into the `Appointment` table.
- If concurrent requests hit the database, the first transaction commits the row. The second transaction will trigger a unique constraint violation at the database level.
- The API catches this specific error (Prisma code `P2002`) and returns an HTTP `409 Conflict`.

## 2. Slot Hold Mechanism
Patients need time to fill out pre-visit symptom forms without losing their selected slot.

**Implementation:**
- When a slot is selected, an appointment is immediately created with the status `HELD`.
- This `HELD` status locks the slot using the same unique constraint mentioned above.
- The system runs a periodic sweep (or background job) to delete `HELD` appointments that are older than 15 minutes, freeing the slot if the user abandons the flow.

## 3. Doctor Leave Conflict Handling
When a doctor's availability changes (e.g., they call in sick), existing appointments must be handled gracefully.

**Implementation:**
- Admin creates a `DoctorLeave` record for a specific date.
- The system starts a transaction and finds all `CONFIRMED` appointments for that doctor on that date.
- The appointments are updated to `RESCHEDULE_REQUIRED`. Crucially, they are *not* deleted, preserving the audit trail and symptom history.
- `OutboxEvent` records are inserted for each affected appointment.
- Background workers process the outbox events to send `LEAVE_CONFLICT` emails to the patients with a link to pick a new slot.

## 4. Notification Failure Handling (Transactional Outbox)
Standard API calls to third-party services (Resend, Google Calendar, LLM) are vulnerable to network timeouts. If done synchronously during booking, an email failure could cause the booking to fail, or worse, the booking succeeds but the email API times out, leaving the system in an inconsistent state.

**Implementation:**
- We use the **Transactional Outbox Pattern**.
- During the appointment confirmation transaction, we insert an `OutboxEvent` containing the email payload.
- Because it's a single database transaction, either both the booking and the outbox event succeed, or neither does. 
- A BullMQ worker continuously polls/processes `OutboxEvent`s. If Resend is down, BullMQ handles exponential backoff retries. The user's booking is safe.

## 5. LLM Architecture
AI is used to enhance the pre-visit and post-visit experience.
- **Pre-visit:** The patient submits symptoms. A background job sends the symptoms to Gemini with a strict JSON schema prompt to extract `urgencyLevel`, `chiefComplaint`, and `suggestedQuestions`. The result is saved to the `PreVisitSummary` table and presented to the doctor.
- **Post-visit:** The doctor enters clinical notes. A background job converts them into a patient-friendly summary.
- **Failure handling:** If the LLM is down, the raw symptoms/notes are still safely stored in the database. The job is marked as `FAILED` and can be retried. The application gracefully degrades, showing the raw notes instead of crashing.
