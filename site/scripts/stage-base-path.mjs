/**
 * Next export + basePath: HTML/JS apuntan a /escuelascooldash/* pero el build
 * deja archivos en out/. Movemos todo bajo out/<basePath>/ para Workers Assets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const outDir = path.join(siteRoot, "out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/escuelascooldash").replace(
  /^\/|\/$/g,
  ""
);

if (!basePath) {
  console.log("stage-base-path: sin basePath, omitido.");
  process.exit(0);
}

const targetDir = path.join(outDir, basePath);
if (fs.existsSync(targetDir)) {
  console.log(`stage-base-path: ${targetDir} ya existe, omitido.`);
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const name of fs.readdirSync(outDir)) {
  if (name === basePath || name === ".DS_Store") continue;
  fs.renameSync(path.join(outDir, name), path.join(targetDir, name));
}

console.log(`stage-base-path: contenido movido → out/${basePath}/`);
