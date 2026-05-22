import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diary — Mood Tracker",
  description: "A visual diary and mood tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
