import Image from "next/image";
import PipelineFigure from "@/components/PipelineFigure";
import TeamSocialLinks from "@/components/TeamSocialLinks";
import teamData from "@/data/team.json";

const REPO_URL = "https://github.com/JDConejeros/HeatSchoolsDash";

type TeamMember = {
  id: string;
  name: string;
  degree: string | null;
  role: string;
  affiliation: string | string[];
  photo: string | null;
  linkedin: string | null;
  orcid: string | null;
  github: string | null;
};

function formatMemberName(member: TeamMember): string {
  return member.degree ? `${member.degree} ${member.name}` : member.name;
}

function memberInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatAffiliations(affiliation: string | string[]): string[] {
  return Array.isArray(affiliation) ? affiliation : [affiliation];
}

/**
 * Página Sobre el proyecto EscuelasCool.
 */
export default function AcercaPage() {
  const team = teamData.members as TeamMember[];

  return (
    <div className="container">
      <div className="acerca-page">
        <h1>EscuelasCool</h1>

        <h2 className="acerca-section-title">Sobre el proyecto</h2>
        <section className="panel">
          <p className="acerca-lead">
            EscuelasCool es un proyecto de investigación financiado por el Wellcome Climate Impacts
            Award (331072/Z/25/Z) que reúne investigadores, organizaciones de la sociedad civil y
            defensores de la salud de América Latina para entender la magnitud del calor extremo en
            las escuelas y generar evidencia que impulse cambios de política concretos.
          </p>
          <p className="acerca-lead">
            El calor extremo es una de las consecuencias más peligrosas y menos visibles del cambio
            climático. Para niños y niñas en edad escolar que pasan horas en aulas mal ventiladas,
            representa una amenaza directa para su salud, rendimiento cognitivo y bienestar.
          </p>
          <p className="acerca-lead">
            Trabajamos en Chile, Colombia y Perú, países que enfrentan tendencias aceleradas de
            calentamiento, para construir un panorama regional de la exposición al calor en las
            escuelas y desarrollar recomendaciones prácticas listas para la política pública.
          </p>
          <p className="acerca-objectives-label">Qué investigamos:</p>
          <ul className="acerca-list">
            <li>
              <strong>Medición de exposición al calor:</strong> documentando las condiciones de
              temperatura dentro de las aulas en distintos contextos y niveles socioeconómicos de la
              región.
            </li>
            <li>
              <strong>Impactos en salud y cognición:</strong> evaluando cómo el calor extremo afecta
              la salud física, el bienestar mental y la capacidad de aprendizaje de los estudiantes.
            </li>
            <li>
              <strong>Análisis del panorama de políticas:</strong> mapeo de regulaciones existentes,
              brechas y oportunidades para políticas de salud escolar frente al calor en Chile,
              Colombia y Perú.
            </li>
            <li>
              <strong>Equidad y vulnerabilidad:</strong> entendiendo qué comunidades y escuelas están
              en mayor riesgo, con foco en las disparidades socioeconómicas.
            </li>
            <li>
              <strong>Traducción del conocimiento:</strong> transformando evidencia de investigación
              en materiales accesibles para tomadores de decisiones, educadores y el público.
            </li>
            <li>
              <strong>Incidencia en políticas:</strong> trabajando con gobiernos y sociedad civil para
              convertir la evidencia en políticas protectoras para las comunidades escolares.
            </li>
          </ul>
        </section>

        <h2 className="acerca-section-title">Equipo de Investigación</h2>
        <section className="panel">
          <div className="team-grid">
            {team.map((member) => (
              <article key={member.id} className="team-card">
                <div className="team-photo-wrap">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={`Fotografía de ${formatMemberName(member)}`}
                      width={330}
                      height={330}
                      className="team-photo"
                    />
                  ) : (
                    <span className="team-photo-placeholder" aria-hidden="true">
                      {memberInitials(member.name)}
                    </span>
                  )}
                </div>
                <h3 className="team-name">{formatMemberName(member)}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-affiliation">
                  {formatAffiliations(member.affiliation).map((line) => (
                    <span key={line} className="team-affiliation-line">
                      {line}
                    </span>
                  ))}
                </p>
                <TeamSocialLinks
                  linkedin={member.linkedin}
                  orcid={member.orcid}
                  github={member.github}
                />
              </article>
            ))}
          </div>
        </section>

        <h2 className="acerca-section-title">El visualizador</h2>
        <section className="panel">
          <p>
            La plataforma interactiva EscuelasCool permite explorar cómo el calor afecta a
            establecimientos educacionales en Chile, Colombia y Perú. Combina mapas, indicadores
            agregados y series de temperatura para apoyar el análisis y la comunicación con equipos
            técnicos, comunidades escolares y tomadores de decisión.
          </p>
          <p className="acerca-objectives-label">Objetivos del visualizador:</p>
          <ul className="acerca-list">
            <li>Hacer legible la magnitud y distribución geográfica del calor en escuelas.</li>
            <li>Comparar indicadores climáticos, de bienestar y de salud entre países y territorios.</li>
            <li>Facilitar la exploración desde el panorama regional hasta el detalle por escuela.</li>
            <li>Entregar gráficos y mapas exportables para informes, talleres e incidencia pública.</li>
            <li>Servir como plataforma abierta y reproducible para futuras rondas de datos reales.</li>
          </ul>
        </section>

        <h2 className="acerca-section-title">Metodología</h2>
        <section className="panel">
          <div className="acerca-panel-header acerca-panel-header--actions-only">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="acerca-repo-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Revisa nuestro repositorio
            </a>
          </div>
          <p>
            El dashboard sigue un flujo de datos en tres etapas: adquisición, procesamiento y
            visualización, que conecta fuentes geoespaciales y climáticas con un sitio estático
            interactivo, sin servidor de aplicación.
          </p>

          <p className="acerca-objectives-label">Flujo de datos en tres etapas</p>
          <div className="acerca-pipeline">
            <article className="acerca-pipeline-stage">
              <h3>Etapa 1: Adquisición de datos</h3>
              <p>
                Se integran dos líneas de información. Por un lado, <strong>datos de escuela</strong>:
                coordenadas, nivel, sector y matrícula por establecimiento (fuente por definir según
                país). Por otro, <strong>datos climáticos</strong> desde Copernicus CDS (ERA5-Land) y
                Google Earth Engine: series históricas de temperatura (resolución 5-25 km, diaria o
                mensual) y proyecciones CMIP6 NEX-GDDP (escenarios SSP2-4.5 y SSP5-8.5).
              </p>
              <PipelineFigure
                src="/images/pipeline/etapa-1-adquisicion.png"
                alt="Diagrama etapa 1: adquisición de datos de escuela y datos climáticos"
                width={3767}
                height={1961}
                caption="Fuentes de escuelas y clima que alimentan el procesamiento."
              />
            </article>

            <article className="acerca-pipeline-stage">
              <h3>Etapa 2: Procesamiento</h3>
              <p>
                Dos líneas de trabajo convergen en productos analíticos. La <strong>línea
                geoespacial</strong> valida y proyecta los puntos escolares y asigna región y comuna
                (GADM). La <strong>línea tabular/climática</strong> normaliza esquemas, imputa gaps en
                series temporales y calcula índices (PET, WBGT, TX90p, WSDI, días de calor). La{" "}
                <strong>unión de capas</strong> realiza un join espacial y temporal (punto × variable ×
                fecha), generando GeoJSON, Parquet (24 meses) e históricos JSON (15 años).
              </p>
              <PipelineFigure
                src="/images/pipeline/etapa-2-procesamiento.png"
                alt="Diagrama etapa 2: georeferenciación, limpieza, índices climáticos y unión de capas"
                width={4212}
                height={1760}
                caption="Pipeline Python + DuckDB: de datos crudos a artefactos listos para el sitio."
              />
            </article>

            <article className="acerca-pipeline-stage">
              <h3>Etapa 3: Visualización</h3>
              <p>
                Los productos finales se publican junto al sitio en hosting estático (GitHub Pages,
                Vercel, Netlify o Cloudflare Pages). <strong>Next.js</strong> (export estático) arma
                tres niveles de exploración: <strong>Home</strong> con KPIs globales y tarjetas por
                país; <strong>País</strong> con MapLibre GL JS, Observable Plot, filtros y tabla; y{" "}
                <strong>Detalle escolar</strong> con consultas DuckDB-WASM sobre Parquet e históricos
                JSON directamente en el navegador.
              </p>
              <PipelineFigure
                src="/images/pipeline/etapa-3-visualizacion.png"
                alt="Diagrama etapa 3: Next.js estático, pestañas Home, País y Detalle escuela"
                width={4257}
                height={1938}
                caption="Arquitectura del visualizador: 100 % estático, consultas en el cliente."
              />
            </article>
          </div>

          <p className="acerca-objectives-label">Tecnologías clave</p>
          <ul className="acerca-list acerca-methods">
            <li>
              <strong>Pipeline:</strong> Python, pandas, pyarrow y DuckDB (
              <code>pipeline/simulate_data.py</code> en la versión demo).
            </li>
            <li>
              <strong>Mapas:</strong> MapLibre GL JS con clustering, heatmaps de temperatura y capas
              administrativas.
            </li>
            <li>
              <strong>Gráficos:</strong> Observable Plot para series Tmax, percentiles y ventanas
              deslizantes.
            </li>
            <li>
              <strong>Consultas locales:</strong> DuckDB-WASM + httpfs sobre Parquet vía HTTP Range
              Requests.
            </li>
            <li>
              <strong>Publicación:</strong> export estático Next.js, temas claro/oscuro y exportación
              Compartir / PNG / CSV.
            </li>
          </ul>
        </section>

        <h2 className="acerca-section-title">Instituciones socias</h2>
        <section className="panel">
          <ul className="acerca-list">
            <li>Universidad Peruana Cayetano Heredia (Perú)</li>
            <li>Pontificia Universidad Católica de Chile (Chile)</li>
            <li>Universidad de los Andes (Colombia)</li>
            <li>MICROB-R (Regional)</li>
          </ul>
          <p className="acerca-note">
            Investigadora principal: Yasna Palmeiro-Silva,{" "}
            <a href="mailto:ypalmeiro@uc.cl">ypalmeiro@uc.cl</a>
          </p>
        </section>
      </div>
    </div>
  );
}
