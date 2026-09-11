import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Clients, Conversations, Messages, Actions } from './db.js';
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

  let fullAssistantText = '';
  let fullThoughtText = '';

  try {
    for await (const chunk of streamChat({
      modelId: modelId || 'gemini-3.8-flash',
      client,
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
