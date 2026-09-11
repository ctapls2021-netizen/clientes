import fs from 'node:fs';
import path from 'node:path';
import { Actions } from './db.js';

export const WebmasterTools = {
  /**
   * Audita la disponibilidad y salud del sitio web del cliente
   */
  auditSite: async (clientId, domain) => {
    if (!domain) {
      return { success: false, message: 'El cliente no tiene un dominio asignado.' };
    }

    const startTime = Date.now();
    try {
      const targetUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'WebmasterAgent-AuditBot/1.0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });
      const latency = Date.now() - startTime;

      const auditData = {
        url: targetUrl,
        status: res.status,
        statusText: res.statusText,
        latencyMs: latency,
        isSsl: targetUrl.startsWith('https:'),
        server: res.headers.get('server') || 'No revelado',
        contentType: res.headers.get('content-type'),
        timestamp: new Date().toISOString()
      };

      Actions.create({
        clientId,
        type: 'site_audit',
        description: `Auditoría de estado web: Código ${res.status} (${latency}ms)`,
        status: res.ok ? 'success' : 'failed',
        details: auditData
      });

      return { success: true, audit: auditData };
    } catch (err) {
      const errorData = {
        error: err.message,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      Actions.create({
        clientId,
        type: 'site_audit',
        description: `Falla en auditoría web: ${err.message}`,
        status: 'failed',
        details: errorData
      });

      return { success: false, error: err.message };
    }
  },

  /**
   * Lee un archivo de la carpeta de trabajo del cliente
   */
  readFile: async (clientId, relativePath, baseFolder) => {
    try {
      const safeBase = baseFolder || path.resolve('.');
      const targetPath = path.resolve(safeBase, relativePath);

      // Prevenir Path Traversal
      if (!targetPath.startsWith(safeBase)) {
        throw new Error('Acceso no permitido fuera del directorio del proyecto.');
      }

      if (!fs.existsSync(targetPath)) {
        throw new Error(`El archivo ${relativePath} no existe.`);
      }

      const content = fs.readFileSync(targetPath, 'utf-8');
      return { success: true, content, path: relativePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Escribe o modifica un archivo con creación automática de backup
   */
  writeFile: async (clientId, relativePath, content, baseFolder) => {
    try {
      const safeBase = baseFolder || path.resolve('.');
      const targetPath = path.resolve(safeBase, relativePath);

      if (!targetPath.startsWith(safeBase)) {
        throw new Error('Acceso no permitido fuera del directorio del proyecto.');
      }

      // Si el archivo ya existía, crear backup con timestamp
      if (fs.existsSync(targetPath)) {
        const backupPath = `${targetPath}.${Date.now()}.bak`;
        fs.copyFileSync(targetPath, backupPath);
      } else {
        const parentDir = path.dirname(targetPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
      }

      fs.writeFileSync(targetPath, content, 'utf-8');

      Actions.create({
        clientId,
        type: 'code_edit',
        description: `Edición de archivo: ${relativePath} (Backup generado)`,
        status: 'success',
        details: { file: relativePath, size: content.length }
      });

      return { success: true, message: `Archivo ${relativePath} actualizado con éxito.` };
    } catch (err) {
      Actions.create({
        clientId,
        type: 'code_edit',
        description: `Fallo al editar archivo ${relativePath}: ${err.message}`,
        status: 'failed',
        details: { file: relativePath, error: err.message }
      });
      return { success: false, error: err.message };
    }
  }
};
