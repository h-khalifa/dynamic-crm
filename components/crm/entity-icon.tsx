import {
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Folder,
  Handshake,
  Heart,
  Home,
  MessageSquare,
  Shield,
  Star,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icons a tenant can choose for an entity (stored by name in EntityDefinition.icon). */
export const ENTITY_ICONS: Record<string, LucideIcon> = {
  users: Users,
  building: Building2,
  handshake: Handshake,
  message: MessageSquare,
  check: CheckSquare,
  heart: Heart,
  shield: Shield,
  calendar: Calendar,
  stethoscope: Stethoscope,
  home: Home,
  briefcase: Briefcase,
  folder: Folder,
  clipboard: ClipboardList,
  star: Star,
};

export function EntityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ENTITY_ICONS[name] ?? Folder;
  return <Icon className={className ?? "size-4"} />;
}
