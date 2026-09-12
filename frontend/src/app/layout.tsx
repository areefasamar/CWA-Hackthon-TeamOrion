import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karachi Transit AI — Phase 1 MVP",
  description: "Smart Route & Fare Guide for Karachi Transit (Peoples Bus Service Route 1 & Sheraz Coach)",
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
