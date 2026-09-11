import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

const CLOUD_URL = process.env.CLOUD_URL || 'https://webmaster.gdtwo.com';

// Extensiones y carpetas a ignorar
const IGNORED_DIRS = [
  'node_modules',
  '.git',
  '.cache',
  '.astro',
  '.next',
  '.vscode',
  'dist',
  'build',
  'log',
  'logs',
  '__macosx',
  '.gemini',
  '.claude'
];

const IGNORED_EXTENSIONS = [
  '.log',
  '.tmp',
  '.lnk',
  '.bak',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.mp4',
  '.mov',
  '.avi',
  '.webm',
  '.mkv',
  '.exe',
  '.dll',
  '.node',
  '.iso'
];

// Mapeos conocidos de nombres de carpeta a IDs registrados en la plataforma
const FOLDER_ALIASES = {
  'agente-modern': 'modern-form',
  'agente-mulholland': 'mulholland',
  'agente-myhome-builder': 'agente-mhb',
  'mulholland': 'mulholland',
  'mhb': 'agente-mhb',
  'centro-tai': 'agente-centro-tai',
  'exodus': 'agente-exodus',
  'the-abc': 'agente-the-abc',
  'picasso': 'picasso'
};

function shouldIgnore(entryPath, isDirectory) {
  const parts = entryPath.toLowerCase().split(/[\\\/]/);
  if (parts.some(p => IGNORED_DIRS.includes(p))) {
    return true;
  }

  if (!isDirectory) {
    const ext = path.extname(entryPath).toLowerCase();
    if (IGNORED_EXTENSIONS.includes(ext)) {
      return true;
    }
  }

  return false;
}

function normalizeClientId(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function resolveClientId(folderName) {
  const normalized = normalizeClientId(folderName);

  if (FOLDER_ALIASES[normalized]) {
    return FOLDER_ALIASES[normalized];
  }

  try {
    const res = await fetch(`${CLOUD_URL}/api/clients`);
    if (res.ok) {
      const clients = await res.json();
      
      // 1. Coincidencia exacta por ID
      const exactId = clients.find(c => c.id === normalized);
      if (exactId) return exactId.id;

      // 2. Coincidencia normalizada por nombre
      const nameMatch = clients.find(c => normalizeClientId(c.name) === normalized);
      if (nameMatch) return nameMatch.id;

      // 3. Coincidencia parcial inteligente (ej: "modern" -> "modern-form")
      const subMatch = clients.find(c => {
        const cNorm = normalizeClientId(c.name);
        return normalized.includes(c.id) || c.id.includes(normalized) ||
               normalized.includes(cNorm) || cNorm.includes(normalized);
      });
      if (subMatch) return subMatch.id;
    }
  } catch (err) {
    // Si no responde la lista, continuar con el ID normalizado
  }

  return normalized;
}

async function uploadBatch(clientId, files, batchIndex, totalBatches) {
  const zip = new AdmZip();
  let batchSize = 0;

  for (const f of files) {
    zip.addLocalFile(f.fullPath, path.dirname(f.relPath) === '.' ? '' : path.dirname(f.relPath));
    batchSize += f.size;
  }

  const zipBuffer = zip.toBuffer();
  const blob = new Blob([zipBuffer], { type: 'application/zip' });

  const formData = new FormData();
  formData.append('file', blob, `${clientId}-batch-${batchIndex + 1}.zip`);
  formData.append('extractZip', 'true');

  const uploadUrl = `${CLOUD_URL}/api/clients/${clientId}/files`;
  let res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (res.status === 404) {
    // Auto-registrar cliente si no existiera
    await fetch(`${CLOUD_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: clientId,
        name: clientId,
        domain: '',
        stack: 'Web',
        system_prompt: `Eres el Agente Webmaster de ${clientId}.`
      })
    });
    res = await fetch(uploadUrl, { method: 'POST', body: formData });
  }

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error en lote ${batchIndex + 1}/${totalBatches} (${res.status}): ${errorText}`);
  }

  return await res.json();
}

async function main() {
  const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const folderName = path.basename(targetDir);

  console.log('====================================================');
  console.log('       🚀 SINCRONIZADOR WEBMASTER CLOUD');
  console.log('====================================================');
  console.log(`📁 Carpeta local:  ${folderName}`);
  console.log(`🌐 Servidor nube:   ${CLOUD_URL}`);

  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`❌ La ruta no es una carpeta válida: ${targetDir}`);
    process.exit(1);
  }

  const clientId = await resolveClientId(folderName);
  console.log(`🆔 Agente nube ID:  ${clientId}`);
  console.log('----------------------------------------------------');

  console.log('🔍 Escaneando archivos de código y recursos web...');
  const allFiles = [];
  let totalBytes = 0;

  function scanDir(currentPath, currentRel = '') {
    let entries;
    try {
      entries = fs.readdirSync(currentPath);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const relPath = currentRel ? path.join(currentRel, entry) : entry;

      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (shouldIgnore(fullPath, stat.isDirectory())) continue;

      if (stat.isDirectory()) {
        scanDir(fullPath, relPath);
      } else {
        // Ignorar archivos individuales excesivamente pesados (> 15MB)
        if (stat.size <= 15 * 1024 * 1024) {
          allFiles.push({ fullPath, relPath, size: stat.size });
          totalBytes += stat.size;
        } else {
          console.log(`   ⚠️ Omitido por tamaño individual (>15MB): ${relPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
        }
      }
    }
  }

  scanDir(targetDir);

  if (allFiles.length === 0) {
    console.warn(`⚠️ No se encontraron archivos para subir en [${folderName}].`);
    process.exit(0);
  }

  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`📊 Total a sincronizar: ${allFiles.length} archivos (${totalMB} MB)`);

  // Dividir en lotes de máximo 12 MB o 100 archivos por lote para máxima estabilidad
  const MAX_BATCH_BYTES = 12 * 1024 * 1024;
  const MAX_BATCH_FILES = 100;
  const batches = [];
  let currentBatch = [];
  let currentBatchBytes = 0;

  for (const f of allFiles) {
    if (currentBatch.length >= MAX_BATCH_FILES || (currentBatchBytes + f.size > MAX_BATCH_BYTES && currentBatch.length > 0)) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchBytes = 0;
    }
    currentBatch.push(f);
    currentBatchBytes += f.size;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`📦 Empaquetado en ${batches.length} lote(s) optimizado(s)...`);
  console.log('☁️  Iniciando transferencia a la nube...');

  try {
    let uploadedCount = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchMB = (batch.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2);
      process.stdout.write(`   ⬆️ [Lote ${i + 1}/${batches.length}] Enviando ${batch.length} archivos (${batchMB} MB)... `);
      
      const res = await uploadBatch(clientId, batch, i, batches.length);
      uploadedCount += (res.count || batch.length);
      console.log('✅ OK');
    }

    console.log('====================================================');
    console.log(`✨ ¡SINCRONIZACIÓN EXITOSA!`);
    console.log(`✅ ${uploadedCount} archivos actualizados en el servidor.`);
    console.log(`🌐 Acceder al agente en: ${CLOUD_URL}`);
    console.log('====================================================');
  } catch (err) {
    console.error(`\n❌ Error durante la sincronización: ${err.message}`);
    process.exit(1);
  }
}

main();

