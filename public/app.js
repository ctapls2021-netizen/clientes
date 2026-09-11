// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
const state = {
  clients: [],
  activeClientId: null,
  activeConversationId: null,
  models: [],
  selectedModelId: 'gemini-3.6-flash',
  hasGeminiKey: false,
  explorer: {
    allFiles: [],
    currentPath: '',
    history: [],
    searchQuery: '',
    sortBy: 'name',
    sortAsc: true,
    selectedId: null
  }
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

  // Archivos & Explorador de Archivos Windows
  btnOpenFiles: document.getElementById('btn-open-files'),
  clientFilesBadge: document.getElementById('client-files-badge'),
  filesModal: document.getElementById('files-modal'),
  filesModalOverlay: document.getElementById('files-modal-overlay'),
  btnCloseFiles: document.getElementById('btn-close-files'),
  explorerWindowTitle: document.getElementById('explorer-window-title'),
  btnRefreshFiles: document.getElementById('btn-refresh-files'),
  btnTriggerFiles: document.getElementById('btn-trigger-files'),
  btnTriggerFolder: document.getElementById('btn-trigger-folder'),
  fileInputElement: document.getElementById('file-input-element'),
  folderInputElement: document.getElementById('folder-input-element'),
  btnNavBack: document.getElementById('btn-nav-back'),
  btnNavUp: document.getElementById('btn-nav-up'),
  explorerBreadcrumbs: document.getElementById('explorer-breadcrumbs'),
  explorerSearchInput: document.getElementById('explorer-search-input'),
  explorerTableBody: document.getElementById('explorer-table-body'),
  explorerEmptyState: document.getElementById('explorer-empty-state'),
  statusbarItemsCount: document.getElementById('statusbar-items-count'),
  statusbarSelectedInfo: document.getElementById('statusbar-selected-info'),
  explorerSyncStatus: document.getElementById('explorer-sync-status'),
  quickLinkCurrentAgent: document.getElementById('quick-link-current-agent'),
  quickLinkAgentName: document.getElementById('quick-link-agent-name'),
  quickLinkDownloads: document.getElementById('quick-link-downloads'),
  quickLinkAyrton: document.getElementById('quick-link-ayrton'),
  uploadZone: document.getElementById('upload-zone'),
  thSortName: document.getElementById('th-sort-name'),
  thSortDate: document.getElementById('th-sort-date'),
  thSortType: document.getElementById('th-sort-type'),
  thSortSize: document.getElementById('th-sort-size'),
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

  // Explorador de Archivos Estilo Windows
  DOM.btnOpenFiles.addEventListener('click', openFilesDrawer);
  DOM.btnCloseFiles.addEventListener('click', closeFilesDrawer);
  DOM.filesModalOverlay.addEventListener('click', closeFilesDrawer);
  DOM.btnRefreshFiles.addEventListener('click', () => {
    const current = getCurrentClient();
    if (current) loadClientFiles(current.id);
  });
  DOM.btnNavBack.addEventListener('click', navigateBack);
  DOM.btnNavUp.addEventListener('click', navigateUp);
  DOM.explorerSearchInput.addEventListener('input', (e) => {
    state.explorer.searchQuery = e.target.value.trim().toLowerCase();
    renderExplorerTable();
  });

  // Accesos rápidos laterales
  DOM.quickLinkDownloads.addEventListener('click', () => navigateToFolder(''));
  DOM.quickLinkAyrton.addEventListener('click', () => navigateToFolder(''));
  DOM.quickLinkCurrentAgent.addEventListener('click', () => navigateToFolder(''));

  // Ordenamiento de columnas
  DOM.thSortName.addEventListener('click', () => toggleSort('name'));
  DOM.thSortDate.addEventListener('click', () => toggleSort('date'));
  DOM.thSortType.addEventListener('click', () => toggleSort('type'));
  DOM.thSortSize.addEventListener('click', () => toggleSort('size'));

  // Visor de código/archivos
  DOM.btnCloseViewer.addEventListener('click', () => DOM.fileViewerModal.classList.add('hidden'));

  // Subida de archivos y carpetas
  DOM.btnTriggerFiles.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.fileInputElement.click();
  });

  DOM.btnTriggerFolder.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.folderInputElement.click();
  });

  DOM.fileInputElement.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  });

  DOM.folderInputElement.addEventListener('change', (e) => {
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
// EXPLORADOR DE ARCHIVOS ESTILO WINDOWS
// ==========================================

async function loadClientFiles(clientId) {
  try {
    const res = await fetch(`/api/clients/${clientId}/files`);
    const files = await res.json();
    state.explorer.allFiles = files;
    DOM.clientFilesBadge.textContent = files.length;
    renderExplorer();
    return files;
  } catch (err) {
    console.error('Error cargando archivos:', err);
    return [];
  }
}

async function openFilesDrawer() {
  const client = getCurrentClient();
  if (!client) return;

  state.explorer.currentPath = '';
  state.explorer.history = [];
  state.explorer.searchQuery = '';
  state.explorer.selectedId = null;
  DOM.explorerSearchInput.value = '';

  DOM.explorerWindowTitle.textContent = `Explorador de Archivos - ${client.name}`;
  DOM.quickLinkAgentName.textContent = client.name;
  DOM.filesModal.classList.remove('hidden');

  await loadClientFiles(client.id);
}

function closeFilesDrawer() {
  DOM.filesModal.classList.add('hidden');
}

function navigateToFolder(folderPath) {
  if (state.explorer.currentPath !== folderPath) {
    state.explorer.history.push(state.explorer.currentPath);
  }
  state.explorer.currentPath = folderPath;
  state.explorer.selectedId = null;
  renderExplorer();
}

function navigateBack() {
  if (state.explorer.history.length > 0) {
    state.explorer.currentPath = state.explorer.history.pop();
    state.explorer.selectedId = null;
    renderExplorer();
  }
}

function navigateUp() {
  if (state.explorer.currentPath) {
    state.explorer.history.push(state.explorer.currentPath);
    const parts = state.explorer.currentPath.split('/');
    parts.pop();
    state.explorer.currentPath = parts.join('/');
    state.explorer.selectedId = null;
    renderExplorer();
  }
}

function toggleSort(col) {
  if (state.explorer.sortBy === col) {
    state.explorer.sortAsc = !state.explorer.sortAsc;
  } else {
    state.explorer.sortBy = col;
    state.explorer.sortAsc = true;
  }
  renderExplorerTable();
}

function renderExplorer() {
  renderBreadcrumbs();
  renderExplorerTable();
}

function renderBreadcrumbs() {
  const client = getCurrentClient();
  const clientName = client ? client.name : 'Agente';
  
  DOM.btnNavBack.disabled = state.explorer.history.length === 0;
  DOM.btnNavUp.disabled = !state.explorer.currentPath;

  const crumbs = [
    { label: 'Este equipo', path: '' },
    { label: 'Downloads', path: '' },
    { label: 'Agente Ayrton', path: '' },
    { label: clientName, path: '' }
  ];

  if (state.explorer.currentPath) {
    const segments = state.explorer.currentPath.split('/');
    let accum = '';
    segments.forEach(seg => {
      accum = accum ? `${accum}/${seg}` : seg;
      crumbs.push({ label: seg, path: accum });
    });
  }

  DOM.explorerBreadcrumbs.innerHTML = '';
  crumbs.forEach((c, idx) => {
    const isLast = idx === crumbs.length - 1;
    const item = document.createElement('span');
    item.className = `crumb-item ${isLast ? 'current' : ''}`;
    item.textContent = c.label;
    if (!isLast) {
      item.addEventListener('click', () => navigateToFolder(c.path));
    }
    DOM.explorerBreadcrumbs.appendChild(item);

    if (!isLast) {
      const sep = document.createElement('span');
      sep.className = 'crumb-separator';
      sep.textContent = '›';
      DOM.explorerBreadcrumbs.appendChild(sep);
    }
  });
}

function renderExplorerTable() {
  const currentPath = state.explorer.currentPath;
  const prefix = currentPath ? currentPath + '/' : '';
  const query = state.explorer.searchQuery;

  // Extraer carpetas y archivos directos para el directorio actual
  const foldersMap = new Map();
  const directFiles = [];

  state.explorer.allFiles.forEach(f => {
    const norm = f.filename.replace(/\\/g, '/');

    if (prefix) {
      if (!norm.startsWith(prefix)) return;
      const rel = norm.slice(prefix.length);
      if (rel.includes('/')) {
        const folderName = rel.split('/')[0];
        const folderPath = `${currentPath}/${folderName}`;
        if (!foldersMap.has(folderName)) {
          foldersMap.set(folderName, { name: folderName, path: folderPath, date: f.created_at, count: 1 });
        } else {
          const item = foldersMap.get(folderName);
          item.count++;
          if (new Date(f.created_at) > new Date(item.date)) item.date = f.created_at;
        }
      } else {
        directFiles.push({ ...f, displayName: rel });
      }
    } else {
      if (norm.includes('/')) {
        const folderName = norm.split('/')[0];
        if (!foldersMap.has(folderName)) {
          foldersMap.set(folderName, { name: folderName, path: folderName, date: f.created_at, count: 1 });
        } else {
          const item = foldersMap.get(folderName);
          item.count++;
          if (new Date(f.created_at) > new Date(item.date)) item.date = f.created_at;
        }
      } else {
        directFiles.push({ ...f, displayName: norm });
      }
    }
  });

  let folderItems = Array.from(foldersMap.values()).map(f => ({
    isFolder: true,
    id: `dir_${f.path}`,
    name: f.name,
    path: f.path,
    date: f.date,
    type: 'Carpeta de archivos',
    size: 0,
    sizeFormatted: ''
  }));

  let fileItems = directFiles.map(f => ({
    isFolder: false,
    id: f.id,
    name: f.displayName,
    fullPath: f.filename,
    date: f.created_at,
    type: getFileTypeDescription(f.displayName, false),
    size: f.size,
    sizeFormatted: formatFileSize(f.size, false)
  }));

  // Filtro de búsqueda
  if (query) {
    folderItems = folderItems.filter(i => i.name.toLowerCase().includes(query));
    fileItems = fileItems.filter(i => i.name.toLowerCase().includes(query));
  }

  // Ordenamiento
  const { sortBy, sortAsc } = state.explorer;
  const sortMultiplier = sortAsc ? 1 : -1;

  folderItems.sort((a, b) => a.name.localeCompare(b.name) * sortMultiplier);

  fileItems.sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name) * sortMultiplier;
    } else if (sortBy === 'date') {
      return (new Date(a.date) - new Date(b.date)) * sortMultiplier;
    } else if (sortBy === 'type') {
      return a.type.localeCompare(b.type) * sortMultiplier;
    } else if (sortBy === 'size') {
      return (a.size - b.size) * sortMultiplier;
    }
    return 0;
  });

  // En Windows Explorer las carpetas siempre se presentan primero
  const items = [...folderItems, ...fileItems];

  DOM.explorerTableBody.innerHTML = '';

  if (items.length === 0) {
    DOM.explorerEmptyState.classList.remove('hidden');
  } else {
    DOM.explorerEmptyState.classList.add('hidden');
  }

  items.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = `explorer-row ${item.isFolder ? 'is-folder' : 'is-file'}`;
    if (state.explorer.selectedId === item.id) {
      tr.classList.add('selected');
    }

    const iconHtml = getExplorerIcon(item.name, item.isFolder);
    const dateFormatted = formatFileDate(item.date);

    tr.innerHTML = `
      <td class="col-name">
        <div class="cell-name-content">
          <span class="cell-icon">${iconHtml}</span>
          <span class="cell-filename" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        </div>
      </td>
      <td class="col-date">${dateFormatted}</td>
      <td class="col-type">${escapeHtml(item.type)}</td>
      <td class="col-size">${item.sizeFormatted}</td>
      <td class="col-actions">
        <div class="row-actions-group">
          ${item.isFolder ? `
            <button class="row-action-btn open-folder-btn" title="Abrir carpeta">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Abrir
            </button>
          ` : `
            <button class="row-action-btn view-file-btn" title="Ver archivo">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Ver
            </button>
            <a href="/api/files/${item.id}/download" class="row-action-btn" download title="Descargar">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </a>
            <button class="row-action-btn delete delete-file-btn" title="Eliminar">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          `}
        </div>
      </td>
    `;

    // Selección al hacer un clic
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.row-action-btn') || e.target.closest('a')) return;
      document.querySelectorAll('.explorer-row.selected').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      state.explorer.selectedId = item.id;
      DOM.statusbarSelectedInfo.textContent = `1 elemento seleccionado ${item.isFolder ? '' : `(${item.sizeFormatted})`}`;
    });

    // Doble clic para abrir
    tr.addEventListener('dblclick', () => {
      if (item.isFolder) {
        navigateToFolder(item.path);
      } else {
        previewFile(item.id);
      }
    });

    if (item.isFolder) {
      const openBtn = tr.querySelector('.open-folder-btn');
      if (openBtn) openBtn.addEventListener('click', () => navigateToFolder(item.path));
    } else {
      const viewBtn = tr.querySelector('.view-file-btn');
      if (viewBtn) viewBtn.addEventListener('click', () => previewFile(item.id));
      const delBtn = tr.querySelector('.delete-file-btn');
      if (delBtn) delBtn.addEventListener('click', () => deleteFile(item.id, item.name));
    }

    DOM.explorerTableBody.appendChild(tr);
  });

  // Actualizar status bar
  DOM.statusbarItemsCount.textContent = `${items.length} elemento${items.length === 1 ? '' : 's'}`;
  if (!state.explorer.selectedId) {
    DOM.statusbarSelectedInfo.textContent = '';
  }
}

function getExplorerIcon(name, isFolder) {
  if (isFolder) {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="#facc15" stroke="#ca8a04" stroke-width="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
  }
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f97316" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="10 13 8 15 10 17"></polyline><polyline points="14 13 16 15 14 17"></polyline></svg>`;
    case 'css':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line></svg>`;
    case 'js':
    case 'mjs':
    case 'cjs':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 12v4a2 2 0 0 1-2 2"></path></svg>`;
    case 'astro':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ec4899" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polygon points="12 11 13 14 16 14 13.5 16 14.5 19 12 17 9.5 19 10.5 16 8 14 11 14 12 11"></polygon></svg>`;
    case 'php':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#818cf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="2"></circle></svg>`;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'svg':
    case 'gif':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    case 'json':
    case 'md':
    case 'txt':
    case 'xml':
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
    default:
      return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
  }
}

function getFileTypeDescription(name, isFolder) {
  if (isFolder) return 'Carpeta de archivos';
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'Documento HTML';
    case 'css':
      return 'Hoja de estilo en cascada';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'Archivo JavaScript';
    case 'ts':
      return 'Archivo TypeScript';
    case 'json':
      return 'Archivo JSON';
    case 'php':
      return 'Script PHP';
    case 'py':
      return 'Script de Python';
    case 'astro':
      return 'Componente Astro';
    case 'md':
      return 'Documento Markdown';
    case 'txt':
      return 'Documento de texto';
    case 'png':
      return 'Imagen PNG';
    case 'jpg':
    case 'jpeg':
      return 'Imagen JPEG';
    case 'webp':
      return 'Imagen WebP';
    case 'svg':
      return 'Gráfico vectorial escalable';
    case 'zip':
      return 'Carpeta comprimida (en zip)';
    case 'pdf':
      return 'Documento PDF';
    default:
      return `Archivo ${ext.toUpperCase()}`;
  }
}

function formatFileDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatFileSize(bytes, isFolder) {
  if (isFolder || bytes === undefined || bytes === null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.ceil(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

async function handleFileUpload(filesList) {
  const client = getCurrentClient();
  if (!client) return;

  const total = filesList.length;
  DOM.explorerSyncStatus.textContent = `Subiendo ${total} archivo${total === 1 ? '' : 's'}...`;

  for (let i = 0; i < total; i++) {
    const file = filesList[i];
    const formData = new FormData();
    formData.append('file', file);
    if (file.webkitRelativePath) {
      formData.append('relativePath', file.webkitRelativePath);
    }

    try {
      await fetch(`/api/clients/${client.id}/files`, {
        method: 'POST',
        body: formData
      });
      DOM.explorerSyncStatus.textContent = `Subido ${i + 1}/${total}`;
    } catch (err) {
      console.error(`Error al subir ${file.name}:`, err);
    }
  }

  setTimeout(() => {
    DOM.explorerSyncStatus.textContent = '';
  }, 2500);

  DOM.fileInputElement.value = '';
  DOM.folderInputElement.value = '';
  await loadClientFiles(client.id);
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
