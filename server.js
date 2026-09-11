import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import multer from 'multer';
import { Clients, Conversations, Messages, Actions, ClientFiles } from './db.js';
import { AVAILABLE_MODELS, streamChat } from './models.js';
import { WebmasterTools } from './tools.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de almacenamiento de archivos por cliente
const uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // hasta 25MB

// ==========================================
// RUTAS API
// ==========================================

// Lista de modelos Gemini disponibles
app.get('/api/models', (req, res) => {
  res.json({
    models: AVAILABLE_MODELS,
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });
});

// Clientes (Websites)
app.get('/api/clients', (req, res) => {
  const clients = Clients.getAll();
  res.json(clients);
});

app.get('/api/clients/:id', (req, res) => {
  const client = Clients.getById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(client);
});

app.post('/api/clients', (req, res) => {
  try {
    const newClient = Clients.create(req.body);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const updated = Clients.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Conversaciones
app.get('/api/clients/:id/conversations', (req, res) => {
  const convs = Conversations.getByClient(req.params.id);
  res.json(convs);
});

app.post('/api/clients/:id/conversations', (req, res) => {
  const conv = Conversations.create(req.params.id, req.body.title);
  res.status(201).json(conv);
});

// Mensajes de una conversación
app.get('/api/conversations/:id/messages', (req, res) => {
  const msgs = Messages.getByConversation(req.params.id);
  res.json(msgs);
});

// Historial ilimitado de acciones / auditoría
app.get('/api/clients/:id/actions', (req, res) => {
  const actions = Actions.getByClient(req.params.id);
  res.json(actions);
});

// Herramienta manual: Auditoría de estado web
app.post('/api/clients/:id/tools/audit', async (req, res) => {
  const client = Clients.getById(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const result = await WebmasterTools.auditSite(client.id, client.domain);
  res.json(result);
});

// ==========================================
// ARCHIVOS POR CLIENTE / AGENTE
// ==========================================

// Listar archivos de un cliente
app.get('/api/clients/:id/files', (req, res) => {
  const files = ClientFiles.getByClient(req.params.id);
  res.json(files);
});

// Subir archivo a un cliente
app.post('/api/clients/:id/files', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo.' });
    }
    const client = Clients.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const newFile = ClientFiles.create({
      clientId: client.id,
      filename: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    Actions.create({
      clientId: client.id,
      type: 'file_upload',
      description: `Archivo subido: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
      status: 'success',
      details: { filename: req.file.originalname, size: req.file.size }
    });

    res.status(201).json(newFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ver contenido de un archivo (texto / código)
app.get('/api/files/:id/content', (req, res) => {
  const file = ClientFiles.getById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });

  const filePath = path.join(uploadsDir, file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'El archivo físico no existe.' });
  }

  const isText = file.mimetype?.startsWith('text/') || 
                 /\.(txt|md|js|json|css|html|php|astro|ts|py|sql|xml|env|yml|yaml)$/i.test(file.filename);

  if (isText) {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ filename: file.filename, content, isText: true, size: file.size });
  } else {
    res.json({ filename: file.filename, content: null, isText: false, size: file.size });
  }
});

// Descargar archivo
app.get('/api/files/:id/download', (req, res) => {
  const file = ClientFiles.getById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });

  const filePath = path.join(uploadsDir, file.stored_name);
  res.download(filePath, file.filename);
});

// Eliminar archivo
app.delete('/api/files/:id', (req, res) => {
  const file = ClientFiles.getById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado' });

  const filePath = path.join(uploadsDir, file.stored_name);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) {}
  }

  ClientFiles.delete(req.params.id);

  Actions.create({
    clientId: file.client_id,
    type: 'file_delete',
    description: `Archivo eliminado: ${file.filename}`,
    status: 'success'
  });

  res.json({ success: true, message: 'Archivo eliminado' });
});

// ==========================================
// CHAT CON STREAMING (SSE - Server Sent Events)
// ==========================================
app.post('/api/chat', async (req, res) => {
  const { clientId, conversationId, prompt, modelId } = req.body;

  if (!clientId || !prompt) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
  }

  const client = Clients.getById(clientId);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  // Asegurar conversación activa
  let activeConvId = conversationId;
  if (!activeConvId) {
    const firstTitle = prompt.slice(0, 35) + (prompt.length > 35 ? '...' : '');
    const newConv = Conversations.create(clientId, firstTitle);
    activeConvId = newConv.id;
  }

  // Guardar mensaje del usuario
  Messages.create({
    conversationId: activeConvId,
    role: 'user',
    content: prompt,
    model: modelId
  });

  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Enviar ID de la conversación creada o usada
  res.write(`data: ${JSON.stringify({ type: 'conv_init', conversationId: activeConvId })}\n\n`);

  // Obtener mensajes previos para contexto
  const history = Messages.getByConversation(activeConvId);

  // Enriquecer el contexto del agente con la lista de archivos subidos
  const clientFiles = ClientFiles.getByClient(clientId);
  let enhancedPrompt = client.system_prompt || '';
  if (clientFiles.length > 0) {
    enhancedPrompt += '\n\nArchivos y recursos disponibles en este sitio:\n' + 
      clientFiles.map(f => `- ${f.filename} (${(f.size / 1024).toFixed(1)} KB)`).join('\n') +
      '\nTienes conocimiento pleno de que el usuario ha subido estos archivos.';
  }
  const activeClient = { ...client, system_prompt: enhancedPrompt };

  let fullAssistantText = '';
  let fullThoughtText = '';

  try {
    for await (const chunk of streamChat({
      modelId: modelId || 'gemini-3.6-flash',
      client: activeClient,
      messages: history,
      prompt
    })) {
      if (chunk.thought) {
        fullThoughtText += chunk.thought;
        res.write(`data: ${JSON.stringify({ type: 'thought', delta: chunk.thought })}\n\n`);
      }
      if (chunk.text) {
        fullAssistantText += chunk.text;
        res.write(`data: ${JSON.stringify({ type: 'text', delta: chunk.text })}\n\n`);
      }
    }

    // Persistir respuesta del asistente en SQLite
    Messages.create({
      conversationId: activeConvId,
      role: 'assistant',
      content: fullAssistantText,
      model: modelId,
      thought: fullThoughtText || null
    });

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// Redirigir cualquier ruta desconocida a index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🚀 Webmaster Agent Platform activo`);
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log(`🗄️  Base de Datos: SQLite WAL en ./data/webmaster.db`);
  console.log(`=================================================`);
});
