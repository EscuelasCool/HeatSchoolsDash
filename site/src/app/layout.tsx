import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import Header from "@/components/Header";
import { publicUrl } from "@/lib/paths";
import "@/styles/globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "EscuelasCool, visualizador de datos",
  description:
    "Protegiendo la salud del estudiantado frente al calor extremo en América Latina. Visualizador de exposición al calor en escuelas de Chile, Colombia y Perú.",
};

/**
 * Layout raíz del visualizador EscuelasCool.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <footer className="footer">
            <p>
              © {new Date().getFullYear()} EscuelasCool, #EscuelasCool
            </p>
            <p className="footer-sub">
              Protegiendo la salud del estudiantado frente al calor extremo en América Latina.
            </p>
            <p className="footer-sub">
              Wellcome Climate Impacts Award; 331072/Z/25/Z; licencia MIT (código del visualizador)
            </p>
            <div className="footer-wellcome">
              <img
                src={publicUrl("/images/funded-by-wellcome-black.png")}
                alt="Financiado por Wellcome"
                className="footer-wellcome-img footer-wellcome-img--light"
                width={280}
                height={44}
              />
              <img
                src={publicUrl("/images/funded-by-wellcome-white.png")}
                alt="Financiado por Wellcome"
                className="footer-wellcome-img footer-wellcome-img--dark"
                width={280}
                height={44}
              />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
