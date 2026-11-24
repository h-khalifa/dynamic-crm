import type { IndustryTemplate } from "./types";

export const realEstate: IndustryTemplate = {
  key: "real-estate",
  name: "Real Estate",
  tagline: "Clients, property deals and viewings",
  terms: {
    CONTACT: { singular: "Client", plural: "Clients", icon: "users" },
    COMPANY: { singular: "Brokerage", plural: "Brokerages", icon: "building" },
    DEAL: { singular: "Property Deal", plural: "Property Deals", icon: "home" },
    ACTIVITY: { singular: "Interaction", plural: "Interactions", icon: "message" },
    TASK: { singular: "Task", plural: "Tasks", icon: "check" },
  },
  systemLabels: {
    DEAL: { title: "Property", value: "Price", contact: "Client" },
  },
  fields: {
    CONTACT: [
      { key: "lookingTo", label: "Looking to", type: "SELECT", options: ["Buy", "Rent", "Sell", "Let"] },
      { key: "budget", label: "Budget", type: "CURRENCY" },
      { key: "preferredArea", label: "Preferred area", type: "TEXT" },
    ],
    DEAL: [
      { key: "address", label: "Address", type: "TEXT", required: true },
      { key: "propertyType", label: "Property type", type: "SELECT", options: ["Apartment", "House", "Villa", "Land", "Commercial"] },
      { key: "bedrooms", label: "Bedrooms", type: "NUMBER" },
    ],
  },
  pipeline: {
    name: "Sales",
    stages: [
      { name: "Lead", probability: 10, color: "slate" },
      { name: "Viewing scheduled", probability: 30, color: "blue" },
      { name: "Offer made", probability: 60, color: "amber" },
      { name: "Under contract", probability: 85, color: "violet" },
      { name: "Closed", probability: 100, color: "green" },
    ],
  },
};
