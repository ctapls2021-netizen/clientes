import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

// Configuración del servidor remoto y carpeta base
const CLOUD_URL = process.env.CLOUD_URL || 'https://webmaster.gdtwo.com';
const AGENTS_BASE_DIR = path.resolve('..'); // Carpeta "Agente Ayrton"

// Mapeo de nombres o palabras clave a IDs de clientes
const CLIENTS_MAP = {
  'exodus': { id: 'agente-exodus', folder: 'Agente Exodus' },
  'mulholland': { id: 'mulholland', folder: 'Agente Mulholland' },
  'centro-tai': { id: 'agente-centro-tai', folder: 'agente centro tai' },
  'tai': { id: 'agente-centro-tai', folder: 'agente centro tai' },
  'mhb': { id: 'agente-mhb', folder: 'Agente MyHome Builder' },
  'myhome': { id: 'agente-mhb', folder: 'Agente MyHome Builder' },
  'modern': { id: 'modern-form', folder: 'Agente Modern' },
  'pacific': { id: 'agente-pacific', folder: 'Agente Pacific' },
  'camino': { id: 'agente-camino', folder: 'Agente Camino' },
  'remodelme': { id: 'agente-remodelme', folder: 'Agente Remodelme' },
  'medano': { id: 'agente-medano', folder: 'Agente Medano' },
  'timeless': { id: 'agente-timeless', folder: 'Agente Timeless' },
  'concierge': { id: 'agente-concierge', folder: 'Agente Concierge' },
  'picasso': { id: 'picasso', folder: 'Picasso' },
  'ayrton-web': { id: 'ayrton-web', folder: 'Ayrton-Web' },
  'gabriela': { id: 'agente-gabriela', folder: 'Agente Gabriela' },
  'sandoval': { id: 'agente-sandoval', folder: 'Agente Sandoval' },
  'relaja': { id: 'agente-relaja', folder: 'Agente Relaja' },
  'jobco': { id: 'agente-jobco', folder: 'Agente JOBCO' },
  'ind': { id: 'agente-ind', folder: 'agente IND' },
  'tienda': { id: 'agente-tienda', folder: 'Agente Tienda' },
  'educativo': { id: 'agente-educativo', folder: 'Agente Educativo' },
  'angeles': { id: 'agente-angeles', folder: 'Agente Angeles' },
  'arana': { id: 'agente-arana', folder: 'Agente Arana' },
  'abc': { id: 'agente-the-abc', folder: 'Agente THE ABC' }
};

// Carpetas o archivos pesados que NO se deben subir a la nube
const IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.astro',
  '.next',
  '.vscode',
  'dist',
  '.DS_Store',
  'Thumbs.db'
];

function shouldIgnore(entryPath) {
  return IGNORED_PATTERNS.some(pattern => entryPath.includes(`/${pattern}/`) || entryPath.includes(`\\${pattern}\\`) || entryPath.endsWith(pattern));
}

export async function syncAgentToCloud(targetKey) {
  const key = targetKey.toLowerCase().trim();
  let clientInfo = CLIENTS_MAP[key];

  // Si no está en el mapa, buscar por coincidencia en carpetas
  if (!clientInfo) {
    const folders = fs.readdirSync(AGENTS_BASE_DIR);
    const matched = folders.find(f => f.toLowerCase().includes(key));
    if (matched) {
      clientInfo = {
        id: matched.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        folder: matched
      };
    }
  }

  if (!clientInfo) {
    console.error(`❌ No se encontró ninguna carpeta para el agente: "${targetKey}"`);
    return { success: false, message: 'Agente no encontrado' };
  }

  // Comprobar la ruta de la carpeta (primero en Agente Ayrton, o en Downloads)
  let folderPath = path.join(AGENTS_BASE_DIR, clientInfo.folder);
  if (!fs.existsSync(folderPath)) {
    // Probar en Downloads directamente
    const parentFolder = path.resolve('..', '..', clientInfo.folder);
    if (fs.existsSync(parentFolder)) {
      folderPath = parentFolder;
    } else {
      console.error(`❌ La carpeta física no existe: ${folderPath}`);
      return { success: false, message: 'Carpeta física no existe' };
    }
  }

  console.log(`📦 Empaquetando archivos de [${clientInfo.folder}] para la nube...`);

  // Crear ZIP en memoria
  const zip = new AdmZip();
  let fileCount = 0;

  function addFolderRecursively(currentPath, zipBasePath = '') {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullItemPath = path.join(currentPath, item);
      const relativeItemPath = path.join(zipBasePath, item);

      if (shouldIgnore(fullItemPath)) continue;

      const stat = fs.statSync(fullItemPath);
      if (stat.isDirectory()) {
        addFolderRecursively(fullItemPath, relativeItemPath);
      } else {
        // Limitar tamaño individual a 15MB para no sobrecargar
        if (stat.size < 15 * 1024 * 1024) {
          zip.addLocalFile(fullItemPath, zipBasePath);
          fileCount++;
        }
      }
    }
  }

  addFolderRecursively(folderPath);

  if (fileCount === 0) {
    console.warn(`⚠️ La carpeta [${clientInfo.folder}] está vacía o solo contiene archivos ignorados.`);
    return { success: false, message: 'Carpeta vacía' };
  }

  console.log(`🚀 Subiendo ${fileCount} archivos a ${CLOUD_URL}...`);

  const zipBuffer = zip.toBuffer();
  const blob = new Blob([zipBuffer], { type: 'application/zip' });

  const formData = new FormData();
  formData.append('file', blob, `${clientInfo.id}.zip`);
  formData.append('extractZip', 'true');

  try {
    const uploadUrl = `${CLOUD_URL}/api/clients/${clientInfo.id}/files`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error en servidor (${res.status}): ${errText}`);
    }

    const result = await res.json();
    console.log(`✅ ¡ÉXITO! Se sincronizó [${clientInfo.folder}] con la nube.`);
    console.log(`🌐 Archivos procesados en la nube: ${result.count || fileCount}`);
    console.log(`🔗 Ver en: ${CLOUD_URL}`);
    return { success: true, count: result.count || fileCount };
  } catch (err) {
    console.error(`❌ Error al subir a la nube: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Ejecución directa desde terminal si se pasa argumento
if (process.argv[2]) {
  const target = process.argv[2];
  syncAgentToCloud(target);
}
