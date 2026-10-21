# Implementeringsplan: Automatisk fokus-display for historiske kart og dokumenter

For å hindre at elevene mister konsentrasjonen («får vandrende øyne») mens Gemini genererer nye svar, implementeres et **automatisk fokus-display**. Dette displayet trer automatisk inn i synsfeltet med en gang elevene har snakket, og holder oppmerksomheten fanget med autentiske kartutsnitt, leirskisser og historiske detaljer fra Stalag Luft III.

---

## 1. Brukerens føring & pedagogisk formål
- **Mål:** Holde elevenes oppmerksomhet uavbrutt rettet mot historien i ventetiden mellom deres taleinnspill og fortellerens nye svar.
- **Automatisk aktivering:** Displayet skal ikke kreve manuelle klikk for å dukke opp under tenkepauser. Det aktiveres automatisk i samme sekund eleven stopper opptaket og fortelleren bearbeider valget.
- **Visuelt anker:** Viser et stemningsfullt, historisk kartutsnitt eller originaldokument relevant for situasjonen, med en kort, spennende detalj elevene kan studere i de 3–5 sekundene det tar å generere svaret.

---

## 2. Innhold & Scenetilpassede kartglimt (`src/data/historicalArchive.ts`)

Vi bygger et datasett med 6 visuelle, illustrerte arkivkort som matcher de 6 scenene i spillet:

1. **Scene 1 (Porten og tråden):**
   - *Visuelt:* Skisse over Nordleirens piggtrådgjerde, vakttårn («Goon Box») og den 15 cm høye hvite varseltråden («warning wire»).
   - *Fokusdetalj:* «Krysset du den hvite tråden, hadde vaktene ordre om å skyte uten varsel. Likevel ble noen frelst av raske kamerater.»
2. **Scene 2 (Komiteen):**
   - *Visuelt:* Skisse av leirens brakkeråd og de hemmelige «X-komiteene» som organiserte 600 fanger i hemmelighet.
   - *Fokusdetalj:* «Falsknerne laget reiseordrer med fargestoff fra rødbeter og gummistempler skåret ut av såpestykker.»
3. **Scene 3 (Mat og pakker):**
   - *Visuelt:* Røde Kors-pakkens innholdsliste: Klim-melk, Corned Beef, sjokolade og såpe.
   - *Fokusdetalj:* «Fangene veide 20–30 kg for lite på tyskernes mat alene. Å dele Røde Kors-pakkene likt var en ren overlevelsesplikt.»
4. **Scene 4 (Vakten ved brakken):**
   - *Visuelt:* Tverrsnitt av brakkegulvet, mursteinsøylene og den hemmelige ovnen som skjulte sjaktinngangen.
   - *Fokusdetalj:* «Tyske 'ilder'-vakter krøp under brakkene med stålspyd for å lytte etter graving under jorden.»
5. **Scene 5 (Kildekritikk og radio):**
   - *Visuelt:* Hemmelig radiomottaker gjemt inni et hult trekkspill.
   - *Fokusdetalj:* «Ryktespredning kunne skape panikk. Kun radiomottakeren ga sikker informasjon fra London.»
6. **Scene 6 (Sjakten Harry og fluktnatten):**
   - *Visuelt:* Målestokk og profil av tunnelen Harry (102 meter lang, 9 meter under jorden, oppgang 30 meter fra skogbrynet).
   - *Fokusdetalj:* «Tunnelen var 60 cm bred. Fangene ble dratt på små traller på treskinner i stummende mørke.»

---

## 3. Komponentstruktur & Visuell opplevelse

### A. Automatisk fokus-display (`src/components/FocusArchiveDisplay.tsx`)
- **Automatisk overgang:** 
  - Når `isAILoading || isTranscribing` er aktiv, animeres fokus-displayet mykt inn på toppen av samtalen med en dempet ramme og arkivpreg (`border-amber-500/30 bg-zinc-900/95`).
  - Viser en stilisert, SVG-basert teknisk skisse/karttegning i arkivstil (pergament-detaljer på mørk bunn).
  - Tittel og 1–2 korte, fengslende setninger som elevene rekker å lese i ventetiden.
  - Pulserende radar/søker-lys eller diskret indikator: *«Fortelleren bearbeider elevenes valg...»*.
- **Overgang ved ankomst:**
  - Når fortellerens svar er ferdig generert, glir displayet elegant inn som et kompakt, utvidbart kart-anker rett over fortellerens melding, slik at elevene kan kaste et blikk på det mens de hører svaret.
  - Elevene kan også klikke for å forstørre kartet i en ren dialogvisning.

### B. Tilpasning i `src/App.tsx`
- Kobler inn `FocusArchiveDisplay` direkte i meldingsflyten.
- Sikrer at fokus holdes på samtalen uten unødige distraksjoner eller hopp i rullefeltet.

---

## 4. Berørte filer
1. `src/data/historicalArchive.ts` (Ny fil): De 6 scenetilknyttede kart- og dokumentglimtene med historiske fakta.
2. `src/components/FocusArchiveDisplay.tsx` (Ny fil): Det automatiske fokus-displayet med karttegninger, pulserende fremdrift og arkivdetaljer.
3. `src/App.tsx`: Integrasjon i ventetilstanden og samtalevisningen.

---

## 5. Verifisering og testplan
1. **Kompilering & Lint:** Kjøre `compile_applet` og `lint_applet` for å sikre 0 feil.
2. **Automatisk respons-test:** Verifisere at displayet automatisk trer i forgrunnen i det elevene stopper mikrofonen og tale transkriberes.
3. **Visuell tilstedeværelse:** Verifisere at kartet og teksten er tydelig leselig på 3–5 sekunder, og at det ikke flimrer eller forstyrrer når svaret dukker opp.
4. **Scenesynkronisering:** Teste at displayet viser relevant kart (f.eks. varseltråd for Scene 1, sjakten for Scene 6).
