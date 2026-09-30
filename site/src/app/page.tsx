import HomePageClient from "@/components/HomePageClient";

export default function HomePage() {
  return (
    <div className="container">
      <section className="hero">
        <h1 className="hero-tagline">
          Hacer visible una <em>amenaza silenciosa</em>
        </h1>
        <p className="hero-subtitle">
          Catalizando acción política para proteger la salud y el bienestar de los estudiantes
          frente al calor extremo en América Latina.
        </p>
      </section>

      <HomePageClient />

      <div className="disclaimer">
        <strong>Fuentes:</strong> escuelas georeferenciadas (MINEDUC, DANE, MINEDU) y capas CMIP6
        NEX-GDDP (~0,25°) para temperatura máxima y mínima.
      </div>
    </div>
  );
}
