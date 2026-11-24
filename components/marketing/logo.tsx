import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">D</span>
      <span>
        Dynamic<span className="text-primary">-CRM</span>
      </span>
    </Link>
  );
}
