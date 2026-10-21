import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const port = process.env.PORT || 3000;

// Initialize Gemini SDK with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Best available Google AI Studio models in order of immediate availability
const TEXT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateWithBestModel(params: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;
  for (const model of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} unavailable, trying next candidate:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('Ingen tilgjengelige modeller svarte');
}

// Clean Norwegian Text-to-Speech Endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Fenrir' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Tekst mangler' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY er ikke konfigurert' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: text.trim(),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Ingen lyd ble generert' });
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error('TTS API error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Kunne ikke generere tale' });
  }
});

// Norwegian Speech-to-Text Transcription Endpoint (powered by Google AI Studio Gemini)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Lydopptak mangler' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY er ikke konfigurert' });
    }

    // Normalize mimeType e.g. audio/webm;codecs=opus -> audio/webm
    const cleanMimeType = (mimeType.split(';')[0] || 'audio/webm').trim();

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const instruction =
      'Transkriber denne norske stemmen nøyaktig til ren tekst. Returner KUN hva som blir sagt på norsk uten forklaringer, anførselstegn eller prefikser. Dersom opptaket kun er stillhet eller bakgrunnsstøy, returner en tom tekst.';

    let transcribedText = '';
    let modelUsed = '';

    // First candidate: dedicated gemini-3.5-transcribe
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [audioPart, { text: instruction }],
        },
      });
      modelUsed = 'gemini-3.5-transcribe';

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).audioTranscription?.text) {
          transcribedText += (part as any).audioTranscription.text;
        } else if (part.text) {
          transcribedText += part.text;
        }
      }
    } catch (err: any) {
      console.warn('gemini-3.5-transcribe unavailable, falling back to gemini-3.1-flash-lite:', err?.message || err);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: {
            parts: [audioPart, { text: instruction }],
          },
        });
        modelUsed = 'gemini-3.1-flash-lite';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if ((part as any).audioTranscription?.text) {
            transcribedText += (part as any).audioTranscription.text;
          } else if (part.text) {
            transcribedText += part.text;
          }
        }
      } catch (err2: any) {
        console.warn('gemini-3.1-flash-lite fallback failed, trying gemini-3.8-flash:', err2?.message || err2);
      }
    }

    if (!transcribedText.trim()) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [audioPart, { text: instruction }],
          },
        });
        modelUsed = 'gemini-3.8-flash';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if ((part as any).audioTranscription?.text) {
            transcribedText += (part as any).audioTranscription.text;
          } else if (part.text) {
            transcribedText += part.text;
          }
        }
      } catch (err3: any) {
        console.warn('gemini-3.8-flash fallback notice:', err3?.message || err3);
      }
    }

    // Clean noise artifacts and bracketed silence tokens like [stillhet]
    const cleanResult = transcribedText
      .trim()
      .replace(/\[(?:stillhet|pause|støy|musikk|lyd|pust|applause|unintelligible)\]/gi, '')
      .replace(/\((?:stillhet|pause|støy|musikk|lyd|pust)\)/gi, '')
      .replace(/^["'«»]|["'«»]$/g, '')
      .trim();

    res.json({ text: cleanResult, modelUsed });
  } catch (error: any) {
    console.error('Transcribe API error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Kunne ikke transkribere lyden' });
  }
});

// Live Text Conversation System Prompt Builder
function buildSystemInstruction(studentNames: string) {
  return `Du er spillveileder og historisk forteller for rollespillet «I Halldors fotspor» (Stalag Luft III, 2. verdenskrig).
Elevene (${studentNames || 'Elevene'}) er den norske flygeren Halldor Espelid.
Dette er en direkte stemmestyrt samtale i klasserommet.

STRENGE REGLER:
1. GJØR ALL TEKST KORT (KUTT FYLL):
   - Svar ALLTID i kun 1–2 korte setninger (maks 25–35 ord totalt).
   - Kutt ut alt man ikke trenger å høre! Ingen lange utlegninger, ingen fyllord eller overflødige historiske forklaringer.
   - Si direkte hva som skjer som følge av handlingen deres.
2. LED SPILLEREN MOT DET NESTE STEGET:
   - Led ALLTID spilleren direkte inn i neste valg eller handling.
   - Avslutt hver tur med et kort, ledende spørsmål som driver handlingen videre.
   - Eksempel: «Vakten senker riflen og nikker. Nils Fuglesang hvisker at flukten planlegges. Hva vil du bidra med: utkikk eller sandspredning?»
3. PRIORITER SISTE UTSAGN VED MIKROFON-INPUT:
   - Elevene snakker inn i mikrofonen og diskuterer ofte høyt mens opptaket pågår.
   - Hvis elevene sier flere ting, endrer mening eller kommer med motstridende forslag (f.eks. «Vi løper mot porten... nei vent, vi spør vakten i stedet»), skal du ALLTID PRIORITERE DET SISTE SOM BLE SAGT som deres endelige valg og handling!
4. VAKTER BRUKER IKKE-DØDELIGE METODER (TILGIVENDE MODUS):
   - Vakter i Stalag Luft III følger Genèvekonvensjonen. De skyter IKKE for å drepe ved første forseelse.
   - Ved feil, snoking eller krysning av varseltråd: Bruk tilrop («Halt!»), varselskudd i bakken eller arrest i «kakebu» (isolat) i et døgn.
   - Ikke avslutt spillet (isGameOver=false, outcome="continue"). Gi dem en advarsel, øk tillitsstigen (ladderDelta=+1), og la dem fortsette oppdraget.
   - isGameOver=true skjer kun ved fullført flukt i Scene 6 (outcome="won") eller ved gjentatte ignoreringer av varselskudd.
5. SOLIDARITET & TILLIT (0 til 4):
   - Kloke valg: ladderDelta = -1 (aldri under 0).
   - Uforsiktige valg: ladderDelta = +1.
6. SCENENE KORT FORTALT:
   - Scene 1: Porten og varseltråden (ball over tråden, vakten hever riflen).
   - Scene 2: Komiteen (Nils Fuglesang spør om oppgave: utkikk, sandspredning, pass/kart).
   - Scene 3: Mat og pakker (hemmelig sjokolade; del likt eller tie).
   - Scene 4: Den tyske vakten (avled vakten uten vold ved tunnelsjakten).
   - Scene 5: Kildekritikk (rykte om flytting vs. hemmelig radio).
   - Scene 6: Natten til 25. mars 1944 (sjakten Harry i snøen, nå skogbrynet. Ved fullført rømning: outcome="won", isGameOver=true).

Returner KUN gyldig JSON:
{
  "text": "Kort fortellersvar (1-2 setninger som leder mot neste valg)",
  "newScene": 1,
  "ladderDelta": 0,
  "isGameOver": false,
  "outcome": "continue",
  "pedagogicalFeedback": "Kort pedagogisk kommentar"
}`;
}

// Live Text Conversation Endpoint (Main API for live chat)
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      currentScene = 1,
      ladderLevel = 0,
      studentNames = 'Elevene',
    } = req.body;

    const cleanInput = (message || '').trim();
    if (!cleanInput) {
      return res.status(400).json({ error: 'Meldingstekst mangler' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY er ikke konfigurert' });
    }

    const systemInstruction = buildSystemInstruction(studentNames);

    // Format previous turns for context
    const conversationContext = history
      .slice(-4)
      .map((msg: { role: string; text: string }) => `${msg.role === 'elever' ? studentNames : 'Forteller'}: ${msg.text}`)
      .join('\n');

    const prompt = `HISTORISK KONTEKST:
- Gjeldende scene: Scene ${currentScene} av 6.
- Tillitsnivå: ${ladderLevel} av 4.
- Elevene: ${studentNames}

TIDLIGERE SAMTALE:
${conversationContext || 'Starten av spillet.'}

NYTT MIKROFON-INNSPILL FRA ELEVENE NÅ:
«${cleanInput}»

VIKTIG REGEL FOR EVALUERING:
1. Hvis elevene sier flere ting eller ombestemmer seg underveis i opptaket, skal du ALLTID prioritere det SISTE de sa som deres faktiske handling!
2. Svaret ditt MÅ være kort (1–2 korte setninger, maks 35 ord). Kutt fyllstoff.
3. Led spilleren direkte mot det neste steget eller valget.
Returner kun gyldig JSON.`;

    const { response, modelUsed } = await generateWithBestModel({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);

    // Normalize field names
    const text = parsed.text || parsed.narrative || 'Fortelleren observerer handlingen.';
    const newScene = typeof parsed.newScene === 'number' ? parsed.newScene : currentScene;
    const ladderDelta = typeof parsed.ladderDelta === 'number' ? parsed.ladderDelta : 0;
    const isGameOver = Boolean(parsed.isGameOver);
    const outcome = parsed.outcome || 'continue';
    const pedagogicalFeedback = parsed.pedagogicalFeedback || '';

    res.json({
      text,
      narrative: text,
      newScene,
      ladderDelta,
      isGameOver,
      outcome,
      pedagogicalFeedback,
      modelUsed,
    });
  } catch (error: any) {
    console.error('Chat API error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Feil ved samtale med modellen' });
  }
});

// Backward-compatible alias for /api/game-turn
app.post('/api/game-turn', async (req, res) => {
  try {
    const { studentSpeech, message, ...rest } = req.body;
    const input = studentSpeech || message || '';
    req.body.message = input;

    // Forward to /api/chat logic
    const { history = [], currentScene = 1, ladderLevel = 0, studentNames = 'Elevene' } = rest;

    if (!input.trim()) {
      return res.status(400).json({ error: 'Input mangler' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY mangler' });
    }

    const systemInstruction = buildSystemInstruction(studentNames);
    const prompt = `Gjeldende scene: Scene ${currentScene} av 6.
Tillitsnivå i brakken: Trinn ${ladderLevel} av 4.
Elevenes handling: «${input.trim()}»
Vurder handlingen og svar.`;

    const { response } = await generateWithBestModel({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    const text = parsed.text || parsed.narrative || '';
    res.json({
      text,
      narrative: text,
      newScene: parsed.newScene || currentScene,
      ladderDelta: parsed.ladderDelta ?? 0,
      isGameOver: Boolean(parsed.isGameOver),
      outcome: parsed.outcome || 'continue',
      pedagogicalFeedback: parsed.pedagogicalFeedback || '',
    });
  } catch (err: any) {
    console.error('game-turn error:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Feil' });
  }
});

// Live Streaming Endpoint (Server-Sent Events) for real-time text streaming
app.post('/api/chat-stream', async (req, res) => {
  try {
    const {
      message,
      history = [],
      currentScene = 1,
      ladderLevel = 0,
      studentNames = 'Elevene',
    } = req.body;

    const cleanInput = (message || '').trim();
    if (!cleanInput) {
      return res.status(400).json({ error: 'Meldingstekst mangler' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY ikke konfigurert' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemInstruction = `Du er spillveileder og historisk forteller for rollespillet «I Halldors fotspor» (Stalag Luft III, 1943–1944).
Elevene (${studentNames}) samarbeider som Spitfire-flygeren Halldor Espelid.
Dette er en direkte, levende samtale.

REGLER:
- Svar umiddelbart på elevenes handling i 2–4 korte, innlevelsesrike setninger på norsk.
- Ingen A/B/C/D-alternativer.
- Avslutt alltid med: «Hva gjør Halldor nå?»
- Vær historisk troverdig.

Gjeldende scene: Scene ${currentScene} av 6.
Tillitsnivå: ${ladderLevel} av 4.`;

    const prompt = `Elevenes handling: «${cleanInput}»\nFortsett historien og still neste spørsmål:`;

    const stream = await ai.models.generateContentStream({
      model: TEXT_MODELS[0],
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Chat stream error:', error?.message || error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Feil under streaming' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message, done: true })}\n\n`);
      res.end();
    }
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
