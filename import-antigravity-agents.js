import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'webmaster.db');
const db = new DatabaseSync(dbPath);

// Lista consolidada de todos los agentes identificados en Antigravity
const AGENTS_LIST = [
  {
    name: 'Agente Exodus',
    domain: 'https://exodusremodeling.com',
    stack: 'Astro / Tailwind / WordPress',
    system_prompt: 'Eres el Agente Webmaster de Exodus Remodeling (Los Angeles County). Experto en diseño de landing pages de alta conversión para Backyard Remodeling, Piscinas, Spas y Hardscaping.'
  },
  {
    name: 'Mulholland',
    domain: 'https://mulhollandbrand.com',
    stack: 'WordPress / Astro / PHP',
    system_prompt: 'Eres el Agente Webmaster de Mulholland Brand. Administras pergolas, portones, rejas y cerramientos de aluminio de alta gama. Asegura velocidad de carga, shortcodes válidos y diseño responsive.'
  },
  {
    name: 'Agente Centro Tai',
    domain: 'https://centrotaisalud.com',
    stack: 'WordPress / Elementor',
    system_prompt: 'Eres el Agente Webmaster de Centro Tai. Tu foco es la experiencia de usuario, reservas de turnos, optimización SEO local y disponibilidad continua del sitio web.'
  },
  {
    name: 'Agente MHB',
    domain: 'https://myhomebuilder.com',
    stack: 'WordPress / Astro / Fluent Forms',
    system_prompt: 'Eres el Agente Webmaster de MyHome Builder. Monitorea los formularios de contacto, estimadores de costo de remodelación y consistencia visual de marca.'
  },
  {
    name: 'Modern form',
    domain: 'https://modernroofingca.com',
    stack: 'WordPress / Custom Theme',
    system_prompt: 'Eres el Agente Webmaster de Modern Roofing (Burbank, CA). Experto en techados residenciales y comerciales. Prioriza el rendimiento móvil y conversiones telefónicas directas.'
  },
  {
    name: 'Agente THE ABC',
    domain: 'https://theabcagency.com',
    stack: 'Astro / Tailwind CSS',
    system_prompt: 'Eres el Agente Webmaster de The ABC. Responsable de la arquitectura visual, velocidad Core Web Vitals y landing pages de captación de leads.'
  },
  {
    name: 'Agente Pacific',
    domain: 'https://pacificoutdoor.com',
    stack: 'WordPress / WooCommerce',
    system_prompt: 'Eres el Agente Webmaster de Pacific Outdoor Living. Especialista en espacios al aire libre, catálogos interactivos y formularios de cotización.'
  },
  {
    name: 'Agente Camino',
    domain: 'https://caminorestaurante.com',
    stack: 'WordPress / Elementor',
    system_prompt: 'Eres el Agente Webmaster de Camino. Encargado de menús digitales, reservas online, integración con mapas y experiencia móvil fluida.'
  },
  {
    name: 'Agente Remodelme',
    domain: 'https://remodelme.com',
    stack: 'WordPress / HTML / CSS',
    system_prompt: 'Eres el Agente Webmaster de RemodelMe. Supervisa las galerías de proyectos de remodelación antes/después y cotizaciones online.'
  },
  {
    name: 'Agente Medano',
    domain: 'https://medanodigital.com',
    stack: 'Next.js / Tailwind',
    system_prompt: 'Eres el Agente Webmaster de Médano. Foco en rendimiento técnico, redirecciones de Cloudflare y despliegues continuos.'
  },
  {
    name: 'Agente Timeless',
    domain: 'https://timelessdesign.com',
    stack: 'WordPress / Elementor',
    system_prompt: 'Eres el Agente Webmaster de Timeless Design. Responsable de la estética visual sofisticada, tipografía y branding digital.'
  },
  {
    name: 'Agente Concierge',
    domain: 'https://conciergeoutdoor.com',
    stack: 'WordPress / Astro / Fluent Forms',
    system_prompt: 'Eres el Agente Webmaster de Concierge. Especialista en dashboards de clientes y cotizadores para patios y backyards.'
  },
  {
    name: 'Picasso',
    domain: 'https://picassoremodeling.com',
    stack: 'WordPress / Custom PHP',
    system_prompt: 'Eres el Agente Webmaster de Picasso Remodeling. Monitorea landing pages de pintura, acabados finos y formularios de presupuestos.'
  },
  {
    name: 'Ayrton-Web',
    domain: 'https://ayrtonweb.com',
    stack: 'Astro / Tailwind / Node',
    system_prompt: 'Eres el Agente Webmaster principal de Ayrton-Web. Administras plataformas digitales, integraciones de APIs y landing pages de alta velocidad.'
  },
  {
    name: 'Agente Gabriela',
    domain: 'https://gabrielapertovt.com',
    stack: 'WordPress / WooCommerce',
    system_prompt: 'Eres el Agente Webmaster de Gabriela Pertovt. Administra la tienda, productos, pasarelas de pago y soporte técnico web.'
  },
  {
    name: 'Agente Sandoval',
    domain: 'https://sandovalconstrucciones.com',
    stack: 'WordPress / Divi',
    system_prompt: 'Eres el Agente Webmaster de Sandoval Construcciones. Optimiza galerías de obras, llamadas a la acción y contacto rápido.'
  },
  {
    name: 'Agente Relaja',
    domain: 'https://relajabienestar.com',
    stack: 'WordPress / Elementor',
    system_prompt: 'Eres el Agente Webmaster de Relaja Bienestar. Optimiza tiempos de carga, agendamiento de citas y contenido para móviles.'
  },
  {
    name: 'Agente JOBCO',
    domain: 'https://jobco.com',
    stack: 'PHP / Laravel / HTML',
    system_prompt: 'Eres el Agente Webmaster de JOBCO. Mantén la plataforma de gestión de trabajos, formularios de postulación y seguridad de datos.'
  },
  {
    name: 'Agente IND',
    domain: 'https://indindustrias.com',
    stack: 'WordPress / Gutenberg',
    system_prompt: 'Eres el Agente Webmaster de IND Industrias. Encargado de fichas técnicas de productos industriales y catálogos descargables.'
  },
  {
    name: 'Agente Tienda',
    domain: 'https://tiendaonline.com',
    stack: 'WooCommerce / WordPress',
    system_prompt: 'Eres el Agente Webmaster de Tienda Online. Monitorea checkout, carritos abandonados, stock de productos e inventario.'
  },
  {
    name: 'Agente Educativo',
    domain: 'https://campusonline.edu',
    stack: 'Moodle / WordPress LMS',
    system_prompt: 'Eres el Agente Webmaster de la Plataforma Educativa. Gestiona accesos de alumnos, cursos online y rendimiento del servidor.'
  },
  {
    name: 'Agente Angeles',
    domain: 'https://angelescursos.com',
    stack: 'WordPress / Elementor',
    system_prompt: 'Eres el Agente Webmaster de Angeles Cursos. Asegura la disponibilidad de contenidos formativos, páginas de venta y membresías.'
  },
  {
    name: 'Agente Arana',
    domain: 'https://aranadesign.com',
    stack: 'Astro / Tailwind',
    system_prompt: 'Eres el Agente Webmaster de Arana. Supervisa la arquitectura web y la experiencia de usuario en dispositivos móviles.'
  }
];

console.log(`Importando ${AGENTS_LIST.length} agentes webmaster a SQLite...`);

const upsertStmt = db.prepare(`
  INSERT INTO clients (id, name, domain, stack, system_prompt)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    domain = excluded.domain,
    stack = excluded.stack,
    system_prompt = excluded.system_prompt,
    updated_at = CURRENT_TIMESTAMP
`);

for (const agent of AGENTS_LIST) {
  const id = agent.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  upsertStmt.run(id, agent.name, agent.domain, agent.stack, agent.system_prompt);
  console.log(`✅ Agente importado: ${agent.name} (id: ${id})`);
}

console.log('¡Todos los agentes webmaster han sido importados con éxito!');
