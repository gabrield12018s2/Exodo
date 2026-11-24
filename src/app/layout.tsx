
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Éxodo",
  description: "Tu comunidad. Tus aventuras. Tu mundo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
