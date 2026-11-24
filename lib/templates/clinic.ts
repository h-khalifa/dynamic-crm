import type { IndustryTemplate } from "./types";

export const clinic: IndustryTemplate = {
  key: "clinic",
  name: "Clinic",
  tagline: "Patients, appointments and visit notes",
  terms: {
    CONTACT: { singular: "Patient", plural: "Patients", icon: "heart" },
    COMPANY: { singular: "Insurance Provider", plural: "Insurance Providers", icon: "shield" },
    DEAL: { singular: "Appointment", plural: "Appointments", icon: "calendar" },
    ACTIVITY: { singular: "Visit Note", plural: "Visit Notes", icon: "stethoscope" },
    TASK: { singular: "Follow-up", plural: "Follow-ups", icon: "check" },
  },
  systemLabels: {
    CONTACT: { company: "Insurance provider" },
    DEAL: { title: "Reason for visit", value: "Fee", contact: "Patient", company: "Insurance provider" },
  },
  fields: {
    CONTACT: [
      { key: "dateOfBirth", label: "Date of birth", type: "DATE" },
      { key: "gender", label: "Gender", type: "SELECT", options: ["Female", "Male", "Other"] },
      { key: "bloodType", label: "Blood type", type: "SELECT", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
      { key: "insuranceNumber", label: "Insurance #", type: "TEXT" },
      { key: "allergies", label: "Allergies", type: "TEXTAREA", showInList: false },
    ],
    DEAL: [
      { key: "appointmentDate", label: "Appointment date", type: "DATE", required: true },
      { key: "doctor", label: "Doctor", type: "TEXT" },
      { key: "visitType", label: "Visit type", type: "SELECT", options: ["Consultation", "Check-up", "Procedure", "Emergency"] },
    ],
  },
  pipeline: {
    name: "Appointments",
    stages: [
      { name: "Booked", probability: 30, color: "slate" },
      { name: "Confirmed", probability: 60, color: "blue" },
      { name: "Checked in", probability: 80, color: "amber" },
      { name: "Completed", probability: 100, color: "green" },
      { name: "No-show", probability: 0, color: "red" },
    ],
  },
};
