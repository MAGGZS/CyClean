import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";

/**
 * Display: Archivo variável, com o eixo de largura (wdth). Em peso 800 e largura 125
 * ela vira a grotesca larga e pesada das palavras gigantes, e a mesma família em
 * largura normal serve os títulos, sem carregar uma segunda fonte de display.
 */
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
  axes: ["wdth"],
  fallback: ["Arial Black", "Helvetica Neue", "Arial", "sans-serif"],
});

/** Texto: Manrope, neutra, aberta e com acentuação do português bem resolvida. */
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "CYCLEAN: em qual lixeira isso vai?",
  description:
    "Envie a foto de um objeto. A IA identifica o material, diz em qual lixeira ele vai e como preparar o descarte, seguindo o padrão brasileiro de cores.",
  keywords: [
    "reciclagem",
    "coleta seletiva",
    "lixeira correta",
    "descarte correto",
    "CONAMA 275",
    "resíduos sólidos",
  ],
  authors: [{ name: "CYCLEAN" }],
  creator: "CYCLEAN",
  openGraph: {
    title: "CYCLEAN: em qual lixeira isso vai?",
    description: "Fotografe o objeto e saiba em qual lixeira ele vai e como preparar o descarte.",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "CYCLEAN: em qual lixeira isso vai?",
    description: "Fotografe o objeto e saiba em qual lixeira ele vai.",
  },
};

export const viewport: Viewport = {
  themeColor: "#12241A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${manrope.variable} antialiased`}>
      <body>
        <noscript>
          <style>{`.pre-anim{visibility:visible!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
