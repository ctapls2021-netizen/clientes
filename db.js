import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'webmaster.db');
const db = new DatabaseSync(dbPath);

// Inicializar esquema
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    stack TEXT DEFAULT 'HTML / CSS / JS',
    system_prompt TEXT,
    repo_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    thought TEXT,
    tool_calls TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`);

// Cargar clientes iniciales de ejemplo si la tabla está vacía
const clientCountStmt = db.prepare('SELECT COUNT(*) as count FROM clients');
const { count } = clientCountStmt.get();

if (count === 0) {
  const insertClient = db.prepare(`
    INSERT INTO clients (id, name, domain, stack, system_prompt)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialClients = [
    {
      id: 'exodus',
      name: 'Agente Exodus',
      domain: 'https://exodusremodeling.com',
      stack: 'Astro / Tailwind / WordPress',
      system_prompt: 'Eres el Agente Webmaster de Exodus Remodeling (Los Angeles County). Experto en diseño de landing pages de alta conversión para Backyard Remodeling, Piscinas, Spas y Hardscaping. Mantén un diseño 100% humano, profesional y sin estéticas genéricas de IA.'
    },
    {
      id: 'mulholland',
      name: 'Mulholland',
      domain: 'https://mulhollandbrand.com',
      stack: 'WordPress / Astro / PHP',
      system_prompt: 'Eres el Agente Webmaster de Mulholland Brand. Administras pergolas, portones, rejas y cerramientos de aluminio de alta gama. Asegura velocidad de carga, shortcodes válidos y diseño responsive.'
    },
    {
      id: 'centro-tai',
      name: 'Agente Centro Tai',
      domain: 'https://centrotaisalud.com',
      stack: 'WordPress / Elementor',
      system_prompt: 'Eres el Agente Webmaster de Centro Tai. Tu foco es la experiencia de usuario, reservas de turnos, optimización SEO local y disponibilidad continua del sitio web.'
    },
    {
      id: 'mhb',
      name: 'Agente MHB (MyHome Builder)',
      domain: 'https://myhomebuilder.com',
      stack: 'WordPress / Astro / Fluent Forms',
      system_prompt: 'Eres el Agente Webmaster de MyHome Builder. Monitorea los formularios de contacto, estimadores de costo de remodelación y consistencia visual de marca.'
    },
    {
      id: 'modern-roofing',
      name: 'Modern Roofing',
      domain: 'https://modernroofingca.com',
      stack: 'WordPress / Custom Theme',
      system_prompt: 'Eres el Agente Webmaster de Modern Roofing (Burbank, CA). Experto en techados residenciales y comerciales. Prioriza el rendimiento móvil y conversiones telefónicas directas.'
    }
  ];

  for (const client of initialClients) {
    insertClient.run(client.id, client.name, client.domain, client.stack, client.system_prompt);
  }
}

export const Clients = {
  getAll: () => {
    return db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
  },
  getById: (id) => {
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  },
  create: ({ id, name, domain, stack, system_prompt, repo_path }) => {
    const clientId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    db.prepare(`
      INSERT INTO clients (id, name, domain, stack, system_prompt, repo_path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(clientId, name, domain || '', stack || 'HTML / CSS / JS', system_prompt || '', repo_path || '');
    return Clients.getById(clientId);
  },
  update: (id, { name, domain, stack, system_prompt, repo_path }) => {
    db.prepare(`
      UPDATE clients
      SET name = ?, domain = ?, stack = ?, system_prompt = ?, repo_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, domain, stack, system_prompt, repo_path, id);
    return Clients.getById(id);
  }
};

export const Conversations = {
  getByClient: (clientId) => {
    return db.prepare('SELECT * FROM conversations WHERE client_id = ? ORDER BY created_at DESC').all(clientId);
  },
  getById: (id) => {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  },
  create: (clientId, title) => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare('INSERT INTO conversations (id, client_id, title) VALUES (?, ?, ?)').run(id, clientId, title || 'Nueva Conversación');
    return Conversations.getById(id);
  }
};

export const Messages = {
  getByConversation: (conversationId) => {
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
  },
  create: ({ conversationId, role, content, model, thought, toolCalls }) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, model, thought, tool_calls)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      conversationId,
      role,
      content,
      model || null,
      thought || null,
      toolCalls ? JSON.stringify(toolCalls) : null
    );
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  }
};

export const Actions = {
  getByClient: (clientId, limit = 50) => {
    return db.prepare('SELECT * FROM actions WHERE client_id = ? ORDER BY created_at DESC LIMIT ?').all(clientId, limit);
  },
  create: ({ clientId, type, description, status = 'success', details }) => {
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO actions (id, client_id, type, description, status, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, clientId, type, description, status, details ? JSON.stringify(details) : null);
    return db.prepare('SELECT * FROM actions WHERE id = ?').get(id);
  }
};

export default db;
