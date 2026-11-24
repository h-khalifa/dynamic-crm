import type { IndustryTemplate } from "./types";

export const generic: IndustryTemplate = {
  key: "generic",
  name: "General business",
  tagline: "Contacts, companies and deals",
  terms: {},
  fields: {
    CONTACT: [{ key: "jobTitle", label: "Job title", type: "TEXT" }],
    COMPANY: [{ key: "industry", label: "Industry", type: "TEXT" }],
  },
  pipeline: {
    name: "Sales",
    stages: [
      { name: "New", probability: 10, color: "slate" },
      { name: "Qualified", probability: 30, color: "blue" },
      { name: "Proposal", probability: 50, color: "violet" },
      { name: "Negotiation", probability: 70, color: "amber" },
      { name: "Won", probability: 100, color: "green" },
      { name: "Lost", probability: 0, color: "red" },
    ],
  },
};
