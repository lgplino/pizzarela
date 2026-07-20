import type { Metadata } from "next";
import { Nunito, Shrikhand } from "next/font/google";
import "./globals.css";

const display = Shrikhand({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Pizzarela",
  description: "Quem come pizza em casa — o cardápio do time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
