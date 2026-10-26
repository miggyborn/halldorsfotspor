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
const TEXT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];

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
      'HARD-LOCK TIL NORSK: Brukerne og elevene snakker UTELUKKENDE norsk. De snakker ALDRI noe annet språk enn norsk. ' +
      'Du skal BARE oppfatte og transkribere norsk tale. ' +
      'Selv om et ord eller lydopptak fonetisk kan minne om engelsk eller et annet språk, skal det UTELUKKENDE tolkes og transkriberes som norske ord og setninger. ' +
      'Returner KUN hva som blir sagt på ren norsk uten forklaringer, anførselstegn eller prefikser. ' +
      'Dersom opptaket kun er stillhet eller bakgrunnsstøy, returner en tom tekst.';

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
function buildSystemInstruction(studentNames: string, gameMode: 'guided' | 'open' = 'guided') {
  const isGuided = gameMode === 'guided';

  const modeInstruction = isGuided
    ? `2. VEILEDET MODUS (FOR ELEVER SOM IKKE HAR FULGT NOK MED I TIMEN):
   - Veiledet modus skal være ekstra enkel, oppmuntrende og rett på sak.
   - Dytt elevene tydelig og enkelt i retning målet med konkrete hint.
   - Avslutt svaret med 2–3 veldig enkle og forståelige alternativer elevene kan velge mellom (f.eks. «Vil du gripe tak i fangen, rope en advarsel, eller vinke til vakten?»).
   - Gjør det lett for dem å lykkes selv om de mangler forkunnskaper.`
    : `2. ÅPNE VALG (SELVSTENDIG UTFORDRING UTEN HINT):
   - Du skal ALDRI gi direkte hint, fasitsvar eller ferdige valgmuligheter (IKKE si «Gjør du X, Y eller Z?», «Hva vil du: utkikk eller sandspredning?»). Å finne løsningen er elevenes egen oppgave!
   - Led i stedet opp mot neste steg ved å beskrive omgivelsene, hva andre fanger gjør, eller hva Halldor observerer og kjenner i kroppen.
   - Eksempel: «Vakten snur seg langsomt mot leirporten. Nils og et par andre fanger begynner å samle planker borte ved brakka, mens du kjenner en sterk trang til å bidra før kvelden kommer.»`;

  return `Du er spillveileder og historisk forteller for rollespillet «I Halldors fotspor» (Stalag Luft III, 2. verdenskrig).
Elevene (\${studentNames || 'Elevene'}) er den norske flygeren Halldor Espelid.
Dette er en direkte stemmestyrt samtale i et norsk klasserom.
Spillmodus er: \${isGuided ? 'VEILEDET (enkel med hint og tydelig dult mot mål)' : 'ÅPNE VALG (selvstendig utfordring uten hint)'}.

STRENG HARD-LOCK TIL NORSK (SPRÅKREGEL):
- Brukerne og elevene snakker UTELUKKENDE norsk. De snakker ALDRI noe annet språk enn norsk!
- Du skal BARE oppfatte, vurdere, tolke og svare på norsk.
- All tolkning av elevenes utsagn og all respons (både 'text' og 'pedagogicalFeedback') SKAL være 100 % på feilfri, naturlig norsk.
- Selv om et elevinnspill fonetisk kan minne om engelsk eller et annet fremmedspråk, skal du UTELUKKENDE forstå og tolke det som norsk i sammenheng med rollespillet.
- Det er strengt forbudt å svare på eller bruke engelsk eller andre språk.

STRENGE REGLER:
1. GJØR ALL TEKST KORT (KUTT FYLL):
   - Svar ALLTID i kun 1–2 korte setninger (maks 25–35 ord totalt).
   - Kutt ut alt man ikke trenger å høre! Ingen lange utlegninger, ingen fyllord eller overflødige historiske forklaringer.
   - Si direkte hva som skjer som følge av handlingen deres.
\${modeInstruction}
3. MAN KAN IKKE VELGE OMSTENDIGHETENE, BARE HVA MAN GJØR MED DEM:
   - Elevene kan ALDRI diktere eller endre de ytre omstendighetene (f.eks. kan de ikke si «plutselig sovner alle vaktene», «vakten mister geværet», «gjerdet faller ned»).
   - Omstendighetene og historien er faste rammer bestemt av fortelleren. Elevene velger KUN hva Halldor GJØR i møte med disse omstendighetene.
   - Hvis elevene forsøker å diktere omstendighetene, korrigerer du situasjonen og lar handlingen deres utspille seg i de faktiske, harde realitetene i leiren.
4. ALLE NORMALE VALG SKAL LEDE VIDERE I RETNING FREMOVER I HISTORIEN:
   - Alle handlinger (så lenge de ikke er ekstreme selvmordsaksjoner) skal føre historien fremover til neste scene (newScene skal gå videre til neste scene).
   - Dersom elevene velger uklokt eller uforsiktig, stiger mistanken (ladderDelta = +1), men historien stopper ALDRI opp; den beveger seg videre mot flukten.
   - Kloke, solidariske valg: ladderDelta = -1 (minimum 0).
5. PRIORITER SISTE UTSAGN VED MIKROFON-INPUT:
   - Hvis elevene sier flere ting eller diskuterer i opptaket, skal du ALLTID PRIORITERE DET SISTE SOM BLE SAGT som deres endelige valg og handling!
6. VED HELT EKSTREME FORSØK TAPES SPILLET (isGameOver=true, outcome="isolation_camp"):
   - Hvis elevene forsøker ekstreme, voldelige eller selvmorderiske handlinger (f.eks. angripe vakter med våpen, drepe, slå ned vakter, storme piggtråd eller port i dagslys):
     -> SPILLET TAPES UMIDDELBART! Sett isGameOver=true og outcome="isolation_camp".
     -> Teksten MÅ fortelle at Halldor overmannes og sendes bort til en av de større fangeleirene på permanent isolat uten rømningsmulighet.
   - Fullført flukt i Scene 6: Når de når skogkanten i snøen, sett isGameOver=true og outcome="won".
7. SCENENE (1 til 6):
   - Scene 1: Porten og varseltråden (ball over tråden, vakten hever riflen).
   - Scene 2: Komiteen (forberedelser til flukten; falske pass, sand, utkikk).
   - Scene 3: Mat og pakker (hemmelig sjokolade, fordeling og moral).
   - Scene 4: Den tyske vakten (avlede mistenksom vakt ved sjakten).
   - Scene 5: Kildekritikk (panikkrykter vs. hemmelig BBC-radio).
   - Scene 6: Natten til 25. mars 1944 (sjakten Harry i snøen, nå skogbrynet).

Returner KUN gyldig JSON:
{
  "text": "\${isGuided ? 'Kort fortellersvar med enkelt hint og 2-3 enkle forslag som leder videre' : 'Kort fortellersvar (1-2 setninger som leder historien videre uten hint)'}",
  "newScene": 2,
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
      gameMode = 'guided',
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

    const isGuidedMode = gameMode === 'guided';
    const systemInstruction = buildSystemInstruction(studentNames, isGuidedMode ? 'guided' : 'open');

    // Format previous turns for context
    const conversationContext = history
      .slice(-4)
      .map((msg: { role: string; text: string }) => `${msg.role === 'elever' ? studentNames : 'Forteller'}: ${msg.text}`)
      .join('\n');

    const modeRule = isGuidedMode
      ? '3. SPILLMODUS ER VEILEDET (ENKEL): Skal være ekstra enkel for elever som ikke har fulgt med i timen. Gi et enkelt svar (1–2 setninger) med et tydelig hint og 2–3 enkle forslag som dytter dem rett i retning målet.'
      : '3. SPILLMODUS ER ÅPNE VALG: IKKE gi direkte hint eller alternativer. Led opp mot neste steg ved å beskrive omgivelsene, hva andre fanger gjør eller hva Halldor observerer.';

    const prompt = `HISTORISK KONTEKST:
- Gjeldende scene: Scene ${currentScene} av 6.
- Tillitsnivå: ${ladderLevel} av 4.
- Elevene: ${studentNames}
- Spillmodus: ${isGuidedMode ? 'Veiledet (enkel for elever som ikke har fulgt med, med hint og forslag)' : 'Åpne valg (selvstendig utfordring uten hint)'}

TIDLIGERE SAMTALE:
${conversationContext || 'Starten av spillet.'}

NYTT MIKROFON-INNSPILL FRA ELEVENE NÅ:
«${cleanInput}»

VIKTIG REGEL FOR EVALUERING:
0. HARD-LOCK TIL NORSK: Elevene og brukerne snakker UTELUKKENDE norsk. De snakker ALDRI noe annet språk. Du skal BARE oppfatte og svare på norsk. Både 'text' og 'pedagogicalFeedback' SKAL være 100 % på feilfri, naturlig norsk.
1. Hvis elevene sier flere ting eller ombestemmer seg underveis i opptaket, skal du ALLTID prioritere det SISTE de sa som deres faktiske handling!
2. Svaret ditt MÅ være kort (1–2 korte setninger, maks 35 ord). Kutt alt fyll.
${modeRule}
4. MAN KAN IKKE VELGE OMSTENDIGHETENE: Elevene kan ikke oppdikte endringer i omstendighetene (f.eks. «vaktene sovner», «det begynner å brenne»). Omstendighetene er faste; elevene bestemmer kun Halldors handling.
5. ALLE VALG LEDER HISTORIEN VIDERE: Handlingen skal føre historien fremover til neste scene (newScene = ${Math.min(6, currentScene + 1)}), med mindre det er et ekstremt voldelig selvmordsangrep.
6. VED HELT EKSTREME FORSØK (angripe vakter med vold, storme gjerdet i dagslys): Sett isGameOver=true og outcome="isolation_camp" (sendt til isolatleir uten rømningsmulighet).
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
Dette er en direkte, levende samtale i et norsk klasserom.

STRENG HARD-LOCK TIL NORSK:
- Brukerne og elevene snakker UTELUKKENDE norsk. De snakker aldri noe annet språk enn norsk.
- Du skal BARE oppfatte og svare på norsk. Svaret ditt MÅ være 100 % på feilfri norsk.

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
