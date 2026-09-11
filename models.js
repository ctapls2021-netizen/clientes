import dotenv from 'dotenv';
dotenv.config();

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    speed: 'Ultra Rápido',
    badge: 'Fast',
    description: 'El modelo insignia para tareas diarias de webmaster, respuestas en milisegundos y bajo consumo de cuota.'
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Flash Thinking',
    speed: 'Razonamiento',
    badge: 'Thinking',
    description: 'Modo de pensamiento paso a paso para resolver bugs complejos de código y arquitectura web.'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    speed: 'Razonamiento Profundo',
    badge: 'Pro',
    description: 'Ventana de contexto de hasta 2 millones de tokens. Capaz de inspeccionar repositorios y sitios completos.'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    speed: 'Rápido y Estable',
    badge: 'Standard',
    description: 'Alta eficiencia y estabilidad comprobada para auditorías rutinarias y chequeos automáticos.'
  }
];

/**
 * Stream responses directamente desde la API oficial de Google Gemini
 */
async function* streamGemini(apiKey, modelId, systemPrompt, messages) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error en API Gemini (${response.status}): ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const candidate = parsed.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          for (const part of parts) {
            if (part.thought) {
              yield { thought: part.text || part.thought };
            } else if (part.text) {
              yield { text: part.text };
            }
          }
        } catch (e) {
          // Ignorar chunks intermedios
        }
      }
    }
  }
}

/**
 * Modo demostración cuando aún no se ingresó GEMINI_API_KEY
 */
async function* streamDevFallback(modelId, client, prompt) {
  yield { thought: `Analizando estructura web para [${client.name}] con Gemini...` };
  await new Promise(r => setTimeout(r, 600));

  const intro = `### Agente Webmaster - ${client.name}\n\n`;
  for (const char of intro) {
    yield { text: char };
    await new Promise(r => setTimeout(r, 12));
  }

  const responseText = `He recibido la instrucción para el sitio: **"${prompt}"**.\n\n` +
    `**Ficha del Cliente:**\n` +
    `- **Dominio:** [${client.domain}](${client.domain})\n` +
    `- **Stack técnico:** \`${client.stack}\`\n` +
    `- **Modelo Gemini:** \`${modelId}\`\n\n` +
    `> [!NOTE]\n` +
    `> **Modo Local Activo:** Para habilitar las respuestas de la IA real de Google en vivo, solo necesitas agregar tu \`GEMINI_API_KEY\` en el archivo \`.env\` o en las variables de entorno de EasyPanel en DonWeb.\n\n` +
    `*El historial de acciones y conversaciones se está guardando de manera persistente en la base de datos.*`;

  for (const chunk of responseText.split(' ')) {
    yield { text: chunk + ' ' };
    await new Promise(r => setTimeout(r, 25));
  }
}

/**
 * Orquestador principal de streaming exclusivo de Gemini
 */
export async function* streamChat({ modelId, client, messages, prompt }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const targetModel = modelId || 'gemini-2.0-flash';

  try {
    if (geminiKey) {
      yield* streamGemini(geminiKey, targetModel, client.system_prompt, messages);
      return;
    }

    // Si aún no está la API Key, usar fallback ilustrativo
    yield* streamDevFallback(targetModel, client, prompt);
  } catch (error) {
    yield { text: `\n\n> [!WARNING]\n> **Error al consultar Gemini (${targetModel}):** ${error.message}\n` };
  }
}
