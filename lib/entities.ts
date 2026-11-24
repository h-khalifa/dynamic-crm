import type { EntityKey, FieldType } from "@prisma/client";

export const ENTITY_KEYS = ["CONTACT", "COMPANY", "DEAL", "ACTIVITY", "TASK"] as const satisfies readonly EntityKey[];

export type Term = { singular: string; plural: string; icon: string };
export type Terms = Record<EntityKey, Term>;

export const DEFAULT_TERMS: Terms = {
  CONTACT: { singular: "Contact", plural: "Contacts", icon: "users" },
  COMPANY: { singular: "Company", plural: "Companies", icon: "building" },
  DEAL: { singular: "Deal", plural: "Deals", icon: "handshake" },
  ACTIVITY: { singular: "Activity", plural: "Activities", icon: "message" },
  TASK: { singular: "Task", plural: "Tasks", icon: "check" },
};

/** URL segment for each entity inside a tenant (never shown as a label). */
export const ENTITY_ROUTES: Record<EntityKey, string> = {
  CONTACT: "contacts",
  COMPANY: "companies",
  DEAL: "deals",
  ACTIVITY: "activities",
  TASK: "tasks",
};

export type SystemField = { key: string; label: string; type: FieldType };

/** Built-in columns. Tenants can relabel them (FieldDefinition with isSystem=true). */
export const SYSTEM_FIELDS: Record<EntityKey, SystemField[]> = {
  CONTACT: [
    { key: "firstName", label: "First name", type: "TEXT" },
    { key: "lastName", label: "Last name", type: "TEXT" },
    { key: "email", label: "Email", type: "EMAIL" },
    { key: "phone", label: "Phone", type: "PHONE" },
    { key: "company", label: "Company", type: "TEXT" },
  ],
  COMPANY: [
    { key: "name", label: "Name", type: "TEXT" },
    { key: "domain", label: "Website", type: "URL" },
    { key: "phone", label: "Phone", type: "PHONE" },
  ],
  DEAL: [
    { key: "title", label: "Title", type: "TEXT" },
    { key: "value", label: "Value", type: "CURRENCY" },
    { key: "stage", label: "Stage", type: "SELECT" },
    { key: "contact", label: "Contact", type: "TEXT" },
    { key: "company", label: "Company", type: "TEXT" },
  ],
  ACTIVITY: [
    { key: "type", label: "Type", type: "SELECT" },
    { key: "subject", label: "Subject", type: "TEXT" },
    { key: "body", label: "Details", type: "TEXTAREA" },
    { key: "occurredAt", label: "Date", type: "DATE" },
  ],
  TASK: [
    { key: "title", label: "Title", type: "TEXT" },
    { key: "dueAt", label: "Due date", type: "DATE" },
  ],
};

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Short text" },
  { value: "TEXTAREA", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "CURRENCY", label: "Currency" },
  { value: "DATE", label: "Date" },
  { value: "BOOLEAN", label: "Yes / No" },
  { value: "SELECT", label: "Dropdown" },
  { value: "MULTISELECT", label: "Multi-select" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "URL", label: "URL" },
];

export const ACTIVITY_TYPES = ["NOTE", "CALL", "MEETING", "EMAIL"] as const;

/** Icon names a tenant can pick (rendered by components/crm/entity-icon.tsx). */
export const ICON_NAMES = [
  "users", "building", "handshake", "message", "check", "heart", "shield", "calendar",
  "stethoscope", "home", "briefcase", "folder", "clipboard", "star",
] as const;
