import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Assessment Student Page",
  description: "Mock student submission page for recurring team assessment app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
