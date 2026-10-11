import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mantra Bot | Company Knowledge Agent",
  description: "A grounded chat agent for your company's knowledge.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
