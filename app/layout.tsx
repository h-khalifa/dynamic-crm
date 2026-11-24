import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Dynamic-CRM — the CRM that speaks your industry", template: "%s · Dynamic-CRM" },
  description:
    "A multi-tenant CRM that adapts its language and fields to your business: patients for clinics, clients for agencies, properties for real estate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
