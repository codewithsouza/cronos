import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "./globals.css";

/* Display — serifada de alto contraste. O rosto emocional da marca.
   Nunca em texto corrido. */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500"],
  /* O itálico é carregado de verdade, e não sintetizado. Sem o corte real, o
     navegador apenas inclina o romano: as serifas ficam tortas e o desenho
     cursivo do `a` e do `ç` se perde — exatamente o que se quer numa
     Playfair. Ele só aparece na Vista Anatomia, mas é o tipo de detalhe em que
     falsificar custa mais do que baixar. */
  style: ["normal", "italic"],
});

/* Corpo — grotesk neutra. Seu trabalho é desaparecer. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

/* Dados — monoespaçada, lida como instrumento. */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "CRONOS · O tempo, esculpido",
    template: "%s · CRONOS",
  },
  description:
    "Relojoaria mecânica contemporânea. Todo relógio mede o tempo. O nosso o torna visível como forma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen antialiased">
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
