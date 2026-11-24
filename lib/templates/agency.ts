import type { IndustryTemplate } from "./types";

export const agency: IndustryTemplate = {
  key: "agency",
  name: "Agency",
  tagline: "Clients, projects and proposals",
  terms: {
    CONTACT: { singular: "Contact", plural: "Contacts", icon: "users" },
    COMPANY: { singular: "Client", plural: "Clients", icon: "briefcase" },
    DEAL: { singular: "Project", plural: "Projects", icon: "folder" },
    ACTIVITY: { singular: "Activity", plural: "Activities", icon: "message" },
    TASK: { singular: "Task", plural: "Tasks", icon: "check" },
  },
  systemLabels: {
    CONTACT: { company: "Client" },
    DEAL: { title: "Project name", value: "Budget", company: "Client" },
  },
  fields: {
    COMPANY: [
      { key: "industry", label: "Industry", type: "TEXT" },
      { key: "retainer", label: "On retainer", type: "BOOLEAN" },
    ],
    DEAL: [
      { key: "service", label: "Service", type: "MULTISELECT", options: ["Branding", "Web", "SEO", "Paid ads", "Content"] },
      { key: "deadline", label: "Deadline", type: "DATE" },
    ],
  },
  pipeline: {
    name: "Projects",
    stages: [
      { name: "Brief", probability: 10, color: "slate" },
      { name: "Proposal sent", probability: 40, color: "blue" },
      { name: "Negotiation", probability: 60, color: "amber" },
      { name: "Won", probability: 100, color: "green" },
      { name: "Lost", probability: 0, color: "red" },
    ],
  },
};
