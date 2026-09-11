// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
const state = {
  clients: [],
  activeClientId: null,
  activeConversationId: null,
  models: [],
  selectedModelId: 'gemini-3.6-flash',
  hasGeminiKey: false
};

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const DOM = {
  clientsList: document.getElementById('clients-list'),
  currentClientName: document.getElementById('current-client-name'),
  currentClientDomain: document.getElementById('current-client-domain'),
  currentDomainText: document.getElementById('current-domain-text'),
  currentClientStack: document.getElementById('current-client-stack'),
  messagesContainer: document.getElementById('messages-container'),
  chatCanvas: document.getElementById('chat-canvas'),
  chatForm: document.getElementById('chat-form'),
  promptInput: document.getElementById('prompt-input'),
  btnSend: document.getElementById('btn-send'),
  btnNewChat: document.getElementById('btn-new-chat'),
  btnAuditSite: document.getElementById('btn-audit-site'),
  btnModelSelector: document.getElementById('btn-model-selector'),
  selectedModelName: document.getElementById('selected-model-name'),
  selectedModelBadge: document.getElementById('selected-model-badge'),
  modelDropdown: document.getElementById('model-dropdown'),
  modelOptions: document.getElementById('model-options'),
  apiStatusBadge: document.getElementById('api-status-badge'),
  apiStatusText: document.getElementById('api-status-text'),
  
  // Modals & Drawers
  btnNewClient: document.getElementById('btn-new-client'),
  btnEditClient: document.getElementById('btn-edit-client'),
  clientModal: document.getElementById('client-modal'),
  clientForm: document.getElementById('client-form'),
  btnCloseClientModal: document.getElementById('btn-close-client-modal'),
  btnCancelClient: document.getElementById('btn-cancel-client'),
  modalClientTitle: document.getElementById('modal-client-title'),
  formClientId: document.getElementById('form-client-id'),
  formClientName: document.getElementById('form-client-name'),
  formClientDomain: document.getElementById('form-client-domain'),
  formClientStack: document.getElementById('form-client-stack'),
  formClientPrompt: document.getElementById('form-client-prompt'),
  
  btnOpenActions: document.getElementById('btn-open-actions'),
  actionsDrawer: document.getElementById('actions-drawer'),
  btnCloseActions: document.getElementById('btn-close-actions'),
  actionsList: document.getElementById('actions-list'),

  // Archivos
  btnOpenFiles: document.getElementById('btn-open-files'),
  clientFilesBadge: document.getElementById('client-files-badge'),
  filesDrawer: document.getElementById('files-drawer'),
  btnCloseFiles: document.getElementById('btn-close-files'),
  drawerClientNameFiles: document.getElementById('drawer-client-name-files'),
  uploadZone: document.getElementById('upload-zone'),
  fileInputElement: document.getElementById('file-input-element'),
  filesTotalCount: document.getElementById('files-total-count'),
  filesList: document.getElementById('files-list'),
  fileViewerModal: document.getElementById('file-viewer-modal'),
  btnCloseViewer: document.getElementById('btn-close-viewer'),
  viewerFilename: document.getElementById('viewer-filename'),
  viewerCodeContent: document.getElementById('viewer-code-content'),
  viewerDownloadBtn: document.getElementById('viewer-download-btn')
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function init() {
  setupEventListeners();
  await loadModels();
  await loadClients();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Selector de modelos
  DOM.btnModelSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.modelDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    DOM.modelDropdown.classList.add('hidden');
  });

  DOM.modelDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Envío del chat
  DOM.chatForm.addEventListener('submit', handleChatSubmit);
  DOM.promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      DOM.chatForm.requestSubmit();
    }
  });

  // Botón nueva conversación
  DOM.btnNewChat.addEventListener('click', () => {
    state.activeConversationId = null;
    renderWelcomeMessage();
  });

  // Botón auditar sitio web
  DOM.btnAuditSite.addEventListener('click', handleAuditSite);

  // Modales
  DOM.btnNewClient.addEventListener('click', () => openClientModal());
  DOM.btnEditClient.addEventListener('click', () => {
    const current = getCurrentClient();
    if (current) openClientModal(current);
  });
  DOM.btnCloseClientModal.addEventListener('click', closeClientModal);
  DOM.btnCancelClient.addEventListener('click', closeClientModal);
  DOM.clientForm.addEventListener('submit', handleSaveClient);

  // Drawer de acciones
  DOM.btnOpenActions.addEventListener('click', openActionsDrawer);
  DOM.btnCloseActions.addEventListener('click', closeActionsDrawer);

  // Drawer de Archivos y Subida
  DOM.btnOpenFiles.addEventListener('click', openFilesDrawer);
  DOM.btnCloseFiles.addEventListener('click', closeFilesDrawer);
  DOM.btnCloseViewer.addEventListener('click', () => DOM.fileViewerModal.classList.add('hidden'));

  // Upload handlers (click & drag and drop)
  DOM.uploadZone.addEventListener('click', () => DOM.fileInputElement.click());
  DOM.fileInputElement.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    DOM.uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      DOM.uploadZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    DOM.uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      DOM.uploadZone.classList.remove('dragover');
    });
  });

  DOM.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  });
}

// ==========================================
// GESTIÓN DE MODELOS
// ==========================================
async function loadModels() {
  try {
    const res = await fetch('/api/models');
    const data = await res.json();
    state.models = data.models;
    state.hasGeminiKey = data.hasGeminiKey;

    // Actualizar indicador de estado de API Key
    if (state.hasGeminiKey) {
      DOM.apiStatusBadge.innerHTML = `
        <span class="dot success"></span>
        <span>Gemini API Conectada</span>
      `;
    } else {
      DOM.apiStatusBadge.innerHTML = `
        <span class="dot warning"></span>
        <span>Modo Local (Sin API Key)</span>
      `;
    }

    renderModelOptions();
  } catch (err) {
    console.error('Error cargando modelos:', err);
  }
}

function renderModelOptions() {
  DOM.modelOptions.innerHTML = '';
  state.models.forEach(model => {
    const option = document.createElement('div');
    option.className = `model-option ${model.id === state.selectedModelId ? 'active' : ''}`;
    option.innerHTML = `
      <div class="model-option-top">
        <span class="model-option-name">${model.name}</span>
        <span class="badge-speed">${model.badge}</span>
      </div>
      <div class="model-option-desc">${model.description}</div>
    `;
    option.addEventListener('click', () => {
      state.selectedModelId = model.id;
      DOM.selectedModelName.textContent = model.name;
      DOM.selectedModelBadge.textContent = model.badge;
      DOM.modelDropdown.classList.add('hidden');
      renderModelOptions();
    });
    DOM.modelOptions.appendChild(option);
  });
}

// ==========================================
// GESTIÓN DE CLIENTES
// ==========================================
async function loadClients() {
  try {
    const res = await fetch('/api/clients');
    state.clients = await res.json();
    renderClientsList();

    if (state.clients.length > 0 && !state.activeClientId) {
      selectClient(state.clients[0].id);
    }
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }
}

function renderClientsList() {
  DOM.clientsList.innerHTML = '';
  state.clients.forEach(client => {
    const item = document.createElement('div');
    item.className = `client-item ${client.id === state.activeClientId ? 'active' : ''}`;
    item.innerHTML = `
      <svg class="client-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
      </svg>
      <span>${client.name}</span>
    `;
    item.addEventListener('click', () => selectClient(client.id));
    DOM.clientsList.appendChild(item);
  });
}

function getCurrentClient() {
  return state.clients.find(c => c.id === state.activeClientId);
}

async function selectClient(clientId) {
  state.activeClientId = clientId;
  renderClientsList();

  const client = getCurrentClient();
  if (!client) return;

  // Actualizar cabecera
  DOM.currentClientName.textContent = client.name;
  if (client.domain) {
    DOM.currentClientDomain.style.display = 'inline-flex';
    DOM.currentClientDomain.href = client.domain.startsWith('http') ? client.domain : `https://${client.domain}`;
    DOM.currentDomainText.textContent = client.domain.replace(/^https?:\/\//, '');
  } else {
    DOM.currentClientDomain.style.display = 'none';
  }

  if (client.stack) {
    DOM.currentClientStack.style.display = 'inline-block';
    DOM.currentClientStack.textContent = client.stack;
  } else {
    DOM.currentClientStack.style.display = 'none';
  }

  // Cargar conversaciones previas del cliente
  await loadClientConversations(clientId);
  
  // Cargar archivos del cliente
  await loadClientFiles(clientId);
}

async function loadClientConversations(clientId) {
  try {
    const res = await fetch(`/api/clients/${clientId}/conversations`);
    const convs = await res.json();
    if (convs.length > 0) {
      state.activeConversationId = convs[0].id;
      await loadMessages(state.activeConversationId);
    } else {
      state.activeConversationId = null;
      renderWelcomeMessage();
    }
  } catch (err) {
    console.error('Error cargando conversaciones:', err);
    renderWelcomeMessage();
  }
}

async function loadMessages(conversationId) {
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    const messages = await res.json();
    DOM.messagesContainer.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
  } catch (err) {
    console.error('Error cargando mensajes:', err);
  }
}

function renderWelcomeMessage() {
  const client = getCurrentClient();
  if (!client) return;

  DOM.messagesContainer.innerHTML = `
    <div class="message assistant">
      <div class="message-header">Agente Webmaster &bull; ${client.name}</div>
      <div class="message-body">
        <p>¡Hola! Soy el agente webmaster asignado al sitio <strong>${client.name}</strong>.</p>
        <p>Tengo acceso a las directivas del sitio, stack (<code>${client.stack || 'Web'}</code>) e historial ilimitado de acciones. Puedes pedirme revisar errores, auditar velocidad, proponer mejoras de diseño o editar archivos.</p>
      </div>
    </div>
  `;
}

// ==========================================
// ENVÍO DE MENSAJES Y STREAMING
// ==========================================
async function handleChatSubmit(e) {
  e.preventDefault();
  const prompt = DOM.promptInput.value.trim();
  if (!prompt || !state.activeClientId) return;

  DOM.promptInput.value = '';
  DOM.promptInput.style.height = 'auto';

  // Mostrar mensaje del usuario de inmediato en la UI
  appendMessage({
    role: 'user',
    content: prompt
  });
  scrollToBottom();

  // Crear placeholder del asistente para streaming
  const assistantMsgEl = createAssistantPlaceholder();
  const bodyEl = assistantMsgEl.querySelector('.message-body');
  const thoughtBoxEl = assistantMsgEl.querySelector('.thought-box');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: state.activeClientId,
        conversationId: state.activeConversationId,
        prompt,
        modelId: state.selectedModelId
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'conv_init') {
              state.activeConversationId = data.conversationId;
            } else if (data.type === 'thought') {
              thoughtBoxEl.style.display = 'block';
              thoughtBoxEl.textContent += data.delta;
            } else if (data.type === 'text') {
              fullText += data.delta;
              bodyEl.innerHTML = formatMarkdown(fullText);
            }
            scrollToBottom();
          } catch (err) {}
        }
      }
    }
  } catch (err) {
    bodyEl.innerHTML += `<p style="color: #ef4444;">Error al comunicarse con el servidor: ${err.message}</p>`;
  }
}

function createAssistantPlaceholder() {
  const client = getCurrentClient();
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.innerHTML = `
    <div class="message-header">Agente Webmaster &bull; ${client?.name || 'IA'}</div>
    <div class="thought-box" style="display:none;"></div>
    <div class="message-body"></div>
  `;
  DOM.messagesContainer.appendChild(el);
  return el;
}

function appendMessage(msg) {
  const el = document.createElement('div');
  el.className = `message ${msg.role}`;
  const header = msg.role === 'user' ? 'Tú' : `Agente Webmaster (${msg.model || 'Gemini'})`;
  
  let thoughtHtml = '';
  if (msg.thought) {
    thoughtHtml = `<div class="thought-box">${escapeHtml(msg.thought)}</div>`;
  }

  el.innerHTML = `
    <div class="message-header">${header}</div>
    ${thoughtHtml}
    <div class="message-body">${formatMarkdown(msg.content)}</div>
  `;
  DOM.messagesContainer.appendChild(el);
}

// ==========================================
// HERRAMIENTA: AUDITORÍA DEL SITIO
// ==========================================
async function handleAuditSite() {
  const client = getCurrentClient();
  if (!client) return;

  appendMessage({
    role: 'user',
    content: `Ejecutar auditoría en vivo del sitio web: ${client.domain}`
  });

  const placeholder = createAssistantPlaceholder();
  const bodyEl = placeholder.querySelector('.message-body');
  bodyEl.innerHTML = `<em>Conectando con <strong>${client.domain}</strong> para auditar disponibilidad y certificados SSL...</em>`;
  scrollToBottom();

  try {
    const res = await fetch(`/api/clients/${client.id}/tools/audit`, { method: 'POST' });
    const result = await res.json();

    if (result.success) {
      const a = result.audit;
      bodyEl.innerHTML = `
        <h3>Auditoría de Estado Completada</h3>
        <p><strong>Resultado de la conexión:</strong></p>
        <ul>
          <li><strong>Estado HTTP:</strong> <code>${a.status} ${a.statusText}</code> ${a.status === 200 ? '✅' : '⚠️'}</li>
          <li><strong>Latencia de Respuesta:</strong> <code>${a.latencyMs}ms</code></li>
          <li><strong>Protocolo Seguro (SSL):</strong> ${a.isSsl ? '✅ HTTPS Activo' : '❌ No seguro'}</li>
          <li><strong>Servidor Web:</strong> <code>${a.server}</code></li>
        </ul>
        <p><em>Este reporte ha sido guardado de forma permanente en el registro de auditoría del cliente.</em></p>
      `;
    } else {
      bodyEl.innerHTML = `
        <h3>Falla en la Auditoría</h3>
        <p>No se pudo conectar con el sitio: <code>${result.error}</code></p>
      `;
    }
  } catch (err) {
    bodyEl.innerHTML = `<p style="color:#ef4444;">Error ejecutando auditoría: ${err.message}</p>`;
  }
  scrollToBottom();
}

// ==========================================
// MODAL CLIENTES & ACCIONES
// ==========================================
function openClientModal(client = null) {
  if (client) {
    DOM.modalClientTitle.textContent = 'Editar Cliente';
    DOM.formClientId.value = client.id;
    DOM.formClientName.value = client.name;
    DOM.formClientDomain.value = client.domain || '';
    DOM.formClientStack.value = client.stack || '';
    DOM.formClientPrompt.value = client.system_prompt || '';
  } else {
    DOM.modalClientTitle.textContent = 'Nuevo Cliente / Sitio Web';
    DOM.formClientId.value = '';
    DOM.formClientName.value = '';
    DOM.formClientDomain.value = '';
    DOM.formClientStack.value = 'WordPress / Astro';
    DOM.formClientPrompt.value = 'Eres el Agente Webmaster de este sitio web. Eres responsable de su mantenimiento, diseño y rendimiento.';
  }
  DOM.clientModal.classList.remove('hidden');
}

function closeClientModal() {
  DOM.clientModal.classList.add('hidden');
}

async function handleSaveClient(e) {
  e.preventDefault();
  const id = DOM.formClientId.value;
  const payload = {
    name: DOM.formClientName.value,
    domain: DOM.formClientDomain.value,
    stack: DOM.formClientStack.value,
    system_prompt: DOM.formClientPrompt.value
  };

  try {
    if (id) {
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const created = await res.json();
      state.activeClientId = created.id;
    }
    closeClientModal();
    await loadClients();
    if (state.activeClientId) selectClient(state.activeClientId);
  } catch (err) {
    alert('Error al guardar cliente: ' + err.message);
  }
}

async function openActionsDrawer() {
  const client = getCurrentClient();
  if (!client) return;

  DOM.actionsList.innerHTML = '<p>Cargando historial...</p>';
  DOM.actionsDrawer.classList.remove('hidden');

  try {
    const res = await fetch(`/api/clients/${client.id}/actions`);
    const actions = await res.json();

    if (actions.length === 0) {
      DOM.actionsList.innerHTML = '<p style="color:#6b7280; font-size:13px;">No hay acciones registradas para este cliente todavía.</p>';
      return;
    }

    DOM.actionsList.innerHTML = '';
    actions.forEach(act => {
      const card = document.createElement('div');
      card.className = 'action-card';
      const date = new Date(act.created_at).toLocaleString();
      let detailsHtml = '';
      if (act.details) {
        detailsHtml = `<div class="action-card-details">${escapeHtml(act.details)}</div>`;
      }

      card.innerHTML = `
        <div class="action-card-header">
          <span>${act.type.toUpperCase()}</span>
          <span>${date}</span>
        </div>
        <div class="action-card-desc">${escapeHtml(act.description)}</div>
        ${detailsHtml}
      `;
      DOM.actionsList.appendChild(card);
    });
  } catch (err) {
    DOM.actionsList.innerHTML = `<p style="color:#ef4444;">Error cargando acciones: ${err.message}</p>`;
  }
}

function closeActionsDrawer() {
  DOM.actionsDrawer.classList.add('hidden');
}

// ==========================================
// GESTOR DE ARCHIVOS POR CLIENTE
// ==========================================
async function loadClientFiles(clientId) {
  try {
    const res = await fetch(`/api/clients/${clientId}/files`);
    const files = await res.json();
    DOM.clientFilesBadge.textContent = files.length;
    DOM.filesTotalCount.textContent = `${files.length} archivo${files.length === 1 ? '' : 's'}`;
    renderFilesList(files);
    return files;
  } catch (err) {
    console.error('Error cargando archivos:', err);
    return [];
  }
}

async function openFilesDrawer() {
  const client = getCurrentClient();
  if (!client) return;

  DOM.drawerClientNameFiles.textContent = client.name;
  DOM.filesDrawer.classList.remove('hidden');
  await loadClientFiles(client.id);
}

function closeFilesDrawer() {
  DOM.filesDrawer.classList.add('hidden');
}

async function handleFileUpload(filesList) {
  const client = getCurrentClient();
  if (!client) return;

  for (const file of filesList) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch(`/api/clients/${client.id}/files`, {
        method: 'POST',
        body: formData
      });
    } catch (err) {
      alert(`Error al subir ${file.name}: ${err.message}`);
    }
  }

  DOM.fileInputElement.value = '';
  await loadClientFiles(client.id);
}

function renderFilesList(files) {
  DOM.filesList.innerHTML = '';
  if (files.length === 0) {
    DOM.filesList.innerHTML = '<p style="color:#6b7280; font-size:13px; text-align:center; padding:16px;">Aún no has subido archivos a este agente.</p>';
    return;
  }

  files.forEach(f => {
    const item = document.createElement('div');
    item.className = 'file-item';
    const date = new Date(f.created_at).toLocaleDateString();
    const sizeKb = (f.size / 1024).toFixed(1);

    item.innerHTML = `
      <div class="file-item-left">
        <div class="file-item-icon">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="file-item-info">
          <span class="file-item-name" title="${escapeHtml(f.filename)}">${escapeHtml(f.filename)}</span>
          <div class="file-item-meta">
            <span>${sizeKb} KB</span>
            <span>&bull;</span>
            <span>${date}</span>
          </div>
        </div>
      </div>
      <div class="file-item-actions">
        <button class="file-btn view-btn" title="Ver contenido">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Ver
        </button>
        <a href="/api/files/${f.id}/download" class="file-btn" download title="Descargar">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </a>
        <button class="file-btn delete delete-btn" title="Eliminar archivo">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    item.querySelector('.view-btn').addEventListener('click', () => previewFile(f.id));
    item.querySelector('.delete-btn').addEventListener('click', () => deleteFile(f.id, f.filename));

    DOM.filesList.appendChild(item);
  });
}

async function previewFile(fileId) {
  try {
    const res = await fetch(`/api/files/${fileId}/content`);
    const data = await res.json();

    DOM.viewerFilename.textContent = data.filename;
    DOM.viewerDownloadBtn.href = `/api/files/${fileId}/download`;

    if (data.isText) {
      DOM.viewerCodeContent.textContent = data.content;
    } else {
      DOM.viewerCodeContent.textContent = `[Archivo binario / multimedia: ${data.filename} (${(data.size / 1024).toFixed(1)} KB)]\nPuedes descargarlo usando el botón superior.`;
    }

    DOM.fileViewerModal.classList.remove('hidden');
  } catch (err) {
    alert('Error abriendo archivo: ' + err.message);
  }
}

async function deleteFile(fileId, filename) {
  if (!confirm(`¿Estás seguro de eliminar "${filename}"?`)) return;

  const client = getCurrentClient();
  try {
    await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    if (client) await loadClientFiles(client.id);
  } catch (err) {
    alert('Error eliminando archivo: ' + err.message);
  }
}

// ==========================================
// UTILIDADES
// ==========================================
function scrollToBottom() {
  DOM.chatCanvas.scrollTop = DOM.chatCanvas.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMarkdown(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  
  // Headers
  formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  formatted = formatted.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Bloques de código
  formatted = formatted.replace(/```([a-z]*)\n([\s\S]*?)```/gim, '<pre><code>$2</code></pre>');
  formatted = formatted.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Blockquotes / Alerts
  formatted = formatted.replace(/^> \[\!NOTE\]\s*(.*$)/gim, '<div class="thought-box" style="border-left-color:#3b82f6;"><strong>Nota:</strong> $1</div>');
  formatted = formatted.replace(/^> \[\!WARNING\]\s*(.*$)/gim, '<div class="thought-box" style="border-left-color:#ef4444;"><strong>Alerta:</strong> $1</div>');
  formatted = formatted.replace(/^> (.*$)/gim, '<blockquote style="border-left: 2px solid #4b5563; padding-left: 8px; color: #9ca3af;">$1</blockquote>');

  // Saltos de línea
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

// Iniciar aplicación
window.addEventListener('DOMContentLoaded', init);
