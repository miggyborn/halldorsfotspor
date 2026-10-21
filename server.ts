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
const TEXT_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

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
2. UNNGÅ DIREKTE HINT ELLER FERDIGE SVAR (LED OPP MED OMGIVELSER OG TANKER):
   - Du skal ALDRI gi direkte hint eller ramse opp alternativer til hva man skal gjøre (IKKE si «Gjør du X, Y eller Z?», «Hva vil du: utkikk eller sandspredning?»). Å finne ut løsningen er ELEVENES EGEN OPPGAVE!
   - Led i stedet opp mot neste steg ved å fortelle:
     a) Hva andre fanger eller medsammensvorne gjør i leiren (f.eks. hva Nils gjør, hvordan fluktkomiteen jobber i stillhet, eller hva de andre fangene gjør).
     b) Hva Halldor selv observerer eller kjenner en lyst eller trang til å gjøre (f.eks. en impuls, en tanke, eller spenningen i kroppen).
   - Eksempel: «Vakten snur seg langsomt mot leirporten. Nils og et par andre fanger begynner å samle planker borte ved brakka, mens du kjenner en sterk trang til å bidra før kvelden kommer.»
3. PRIORITER SISTE UTSAGN VED MIKROFON-INPUT:
   - Elevene snakker inn i mikrofonen og diskuterer ofte høyt mens opptaket pågår.
   - Hvis elevene sier flere ting, endrer mening eller kommer med motstridende forslag (f.eks. «Vi løper mot porten... nei vent, vi spør vakten i stedet»), skal du ALLTID PRIORITERE DET SISTE SOM BLE SAGT som deres endelige valg og handling!
4. VED HELT EKSTREME FORSØK TAPES SPILLET (isGameOver=true, outcome="isolation_camp"):
   - Hvis elevene forsøker ekstreme, voldelige eller selvmorderiske handlinger (f.eks. angripe vakter med makt/våpen, drepe, slå ned vakter, storme piggtråd eller port i dagslys):
     -> SPILLET TAPES UMIDDELBART!
     -> Sett isGameOver=true og outcome="isolation_camp".
     -> Teksten MÅ fortelle at Halldor overmannes og sendes bort til en av de større fangeleirene på permanent isolat uten rømningsmulighet.
   - Ved ordinære feil (løpe etter ball, snoke, mistenkelighet): Vaktene bruker ikke-dødelige midler (tilrop, varselskudd i bakken eller et døgn kakebu) og spillet fortsetter (isGameOver=false, outcome="continue", ladderDelta=+1).
   - Fullført flukt i Scene 6: Når de når skogkanten i snøen, sett isGameOver=true og outcome="won".
5. SOLIDARITET & TILLIT (0 til 4):
   - Kloke, solidariske valg: ladderDelta = -1 (aldri under 0).
   - Uforsiktige valg: ladderDelta = +1.
6. SCENENE KORT FORTALT:
   - Scene 1: Porten og varseltråden (ball over tråden, vakten hever riflen).
   - Scene 2: Komiteen (forberedelser til flukten; falske pass, sand, utkikk).
   - Scene 3: Mat og pakker (hemmelig sjokolade, fordeling og moral).
   - Scene 4: Den tyske vakten (avlede mistenksom vakt ved sjakten).
   - Scene 5: Kildekritikk (panikkrykter vs. hemmelig BBC-radio).
   - Scene 6: Natten til 25. mars 1944 (sjakten Harry i snøen, nå skogbrynet).

Returner KUN gyldig JSON:
{
  "text": "Kort fortellersvar (1-2 setninger som leder opp med hva andre gjør og hva du har lyst til å vurdere)",
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

    // Fast and reliable guardrail for extreme violent attempts
    const lowerInput = cleanInput.toLowerCase();
    const isExtremeAction =
      (/\b(drep|kniv|angrip|slå|overmann|storme|skyte|kvel|massakre|våpen)\b/i.test(lowerInput) &&
        /\b(vakt|vakten|vaktene|gjerde|gjerdet|tårn|tårnet|porten)\b/i.test(lowerInput)) ||
      /\b(angripe vakten|drepe vakten|slå ned vakten|storme gjerdet|storme porten|angrip vakten)\b/i.test(lowerInput);

    if (isExtremeAction) {
      return res.json({
        text: 'Det ekstreme forsøket utløser øyeblikkelig full leiralarm! Væpnede forsterkninger overmanner Halldor på stedet, og han sendes vekk til en strengere leir på permanent isolat uten rømningsmulighet.',
        narrative:
          'Det ekstreme forsøket utløser øyeblikkelig full leiralarm! Væpnede forsterkninger overmanner Halldor på stedet, og han sendes vekk til en strengere leir på permanent isolat uten rømningsmulighet.',
        newScene: currentScene,
        ladderDelta: 1,
        isGameOver: true,
        outcome: 'isolation_camp',
        pedagogicalFeedback:
          'Ekstreme, voldelige handlinger mot bevæpnede vakter var dødsdømte i Stalag Luft III og førte til overføring til Gestapo eller isolatleir. Rømning krevde disiplin, samhold og tålmodighet.',
        modelUsed: 'rule-guardrail',
      });
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
2. Svaret ditt MÅ være kort (1–2 korte setninger, maks 35 ord). Kutt alt fyll.
3. IKKE gi direkte hint eller oppgi fasitsvar/konkrete valgmuligheter til neste steg. Led opp med hva andre fanger gjør og hva Halldor observerer eller har lyst til å gjøre, slik at elevene selv må ta initiativ og formulere løsningen.
4. VED HELT EKSTREME FORSØK (f.eks. angripe vakter med vold, storme gjerdet i dagslys, hodeløse selvmordsaksjoner): Sett isGameOver=true og outcome="isolation_camp" (sendt til en av de større fangeleirene på isolat uten rømningsmulighet).
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
    let text = parsed.text || parsed.narrative || 'Fortelleren observerer handlingen.';
    const newScene = typeof parsed.newScene === 'number' ? parsed.newScene : currentScene;
    const ladderDelta = typeof parsed.ladderDelta === 'number' ? parsed.ladderDelta : 0;
    let isGameOver = Boolean(parsed.isGameOver);
    let outcome = parsed.outcome || 'continue';
    const pedagogicalFeedback = parsed.pedagogicalFeedback || '';

    if (outcome === 'isolation_camp') {
      isGameOver = true;
      if (!text.toLowerCase().includes('isolat') && !text.toLowerCase().includes('leir')) {
        text =
          'Det ekstreme forsøket utløser øyeblikkelig full leiralarm. Væpnede forsterkninger overmanner Halldor på stedet, og han sendes til en strengere leir på permanent isolat uten rømningsmulighet.';
      }
    }

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
