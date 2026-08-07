import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustKhata — Offline Billing Software for Indian Shops",
  description: "Fast, offline billing and inventory software for Indian retail shops. GST-ready, keyboard-driven, built for the counter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
