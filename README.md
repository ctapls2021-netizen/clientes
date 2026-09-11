# Antigravity Webmaster Agent Platform 🚀

Plataforma de agentes webmaster autónomos multi-cliente, impulsada por la **API oficial de Google Gemini** y diseñada para administrar y dar soporte a los sitios web de tus clientes desde una interfaz centralizada al estilo Antigravity.

---

## 🌟 Características Principales

1. **Multi-Cliente Aislado:** Cada cliente (`Exodus`, `Mulholland`, `Centro Tai`, etc.) tiene su propia ficha técnica:
   - Dominio y URL.
   - Stack tecnológico (WordPress, Astro, Elementor, PHP, HTML/CSS).
   - Directivas y System Prompt personalizado (reglas de diseño, tonos y restricciones).
2. **Modelos de Google Gemini:**
   - **Gemini 2.0 Flash:** Ultra rápido para cambios y consultas inmediatas.
   - **Gemini 2.0 Flash Thinking:** Razonamiento profundo paso a paso para depurar errores y código.
   - **Gemini 1.5 Pro:** Contexto masivo de hasta 2 millones de tokens para auditar repositorios y carpetas enteras.
   - **Gemini 1.5 Flash:** Eficiente y de bajo consumo.
3. **Historial Ilimitado:**
   - Registro permanente de todas las conversaciones y respuestas de la IA en SQLite WAL (`./data/webmaster.db`).
   - Bitácora de auditoría y acciones ejecutadas por cliente.
4. **Herramientas de Webmaster Integradas:**
   - Auditor de salud y conectividad web (código HTTP, latencia y SSL en vivo).
   - Edición segura de código con creación automática de backups (`.bak`).

---

## 💻 Ejecución Local (En tu PC)

1. Abre una terminal dentro de la carpeta `webmaster-platform`:
   ```bash
   cd "c:\Users\Diego\Downloads\Agente Ayrton\webmaster-platform"
   ```
2. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```
3. Configura tu API Key de Gemini:
   - Abre el archivo `.env` y pega tu clave:
     ```env
     GEMINI_API_KEY=AIzaSy...
     PORT=3000
     ```
   *(Si no tienes API Key aún, puedes obtenerla gratis en [Google AI Studio](https://aistudio.google.com/)).*
4. Inicia el servidor:
   ```bash
   npm start
   ```
5. Abre tu navegador en: **`http://localhost:3000`**

---

## ☁️ Despliegue en DonWeb Cloud con EasyPanel

EasyPanel hace que desplegar esta plataforma en tu Cloud de DonWeb sea ultra rápido mediante Docker:

### Paso 1: En EasyPanel
1. Accede a tu panel de **EasyPanel** en tu servidor DonWeb.
2. Crea un **Nuevo Proyecto** (ej: `Webmasters`).
3. Haz clic en **+ Service** y elige **App**.

### Paso 2: Origen del Código
Tienes dos alternativas súper sencillas:
* **Opción A (GitHub - Recomendada):** Sube esta carpeta a un repositorio privado de GitHub y selecciónalo en EasyPanel.
* **Opción B (Docker Compose):** En EasyPanel elige *Docker Compose* y pega el contenido del archivo `docker-compose.yml`.

### Paso 3: Variables de Entorno
En la pestaña **Environment** de tu servicio en EasyPanel, agrega:
```env
GEMINI_API_KEY=tu_api_key_de_gemini
PORT=3000
NODE_ENV=production
```

### Paso 4: Dominio y SSL
1. En la pestaña **Domains**, añade el subdominio que quieras usar (ej: `webmaster.tudominio.com`).
2. EasyPanel generará automáticamente el certificado **SSL (HTTPS)** gratuito de Let's Encrypt.
3. ¡Haz clic en **Deploy**! En menos de 2 minutos tu plataforma estará en línea 24/7.
