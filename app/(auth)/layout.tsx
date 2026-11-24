import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-lg">{children}</div>
    </div>
  );
}
