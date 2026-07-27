import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Assessment Platform",
  description: "Recurring team assessment app prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
