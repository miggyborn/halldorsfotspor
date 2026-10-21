import { AppIdea } from '../types/game';

export const APP_IDEAS: AppIdea[] = [
  {
    id: 'walkie_talkie_roleplay',
    title: 'Idé 1: «I Halldors fotspor» – To-elevers Walkie-Talkie Rollespill',
    tagline: 'Klasseroms-webapp med radio-mekanikk, Push-to-Talk «OVER», spenningstrinn og automatisk LK20-evaluering.',
    category: 'Interaktivt Rollespill & Tale-app',
    targetAudience: '9.–10. trinn i samfunnsfag og norsk (pararbeid på iPad, PC eller Chromebook)',
    description:
      'En stemningsfull webapplikasjon designet spesifikt for to elever som deler én skjerm eller to sammenkoblede enheter. Elevene inntar rollen som Halldor Espelid. Den interaktive radioen fungerer som en ekte walkie-talkie: Elevene må diskutere sammen og fysisk holde nede eller si «OVER» før spill-KI-en responderer. Appen håndhever en 10–15 minutters tidsramme, visualiserer tillitsstigen i brakken, håndterer dødsvalg verdig og saklig, og genererer en ferdig formatert LK20-vurderingsrapport til læreren.',
    coreMechanics: [
      '«OVER»-protokoll: Fysisk radio-knapp eller Web Speech API talegjenkjenning. KI-en svarer utelukkende med «Lytter.» hvis elevene snakker uten OVER.',
      '4-trinns Tillits- og Matstige: Visuell indikator i HUD (Full tillit → Advarsel → Tapt tid → Siste sjanse → Utestengt/taper).',
      'Pacing-motor (10–15 min): Automatisk tempo-vakt som hopper over sidescener hvis elevene bruker over 4 minutter på en scene.',
      'Pedagogisk Dødsvalg-skjerm: Skånsom, verdig avslutning uten vold eller blod («Så blir alt stille»), med historisk forklaring og mulighet for «prøv på nytt fra siste scene».',
      'Ut-av-rollen Debrief: Avslutter med ekte historiske fakta om Halldor, Askøy, søsteren Ingrid Espelid Hovig og rettsoppgjøret.',
    ],
    pedagogicalBenefits: [
      'Trener muntlig samhandling og saklig argumentasjon i norsk (elevene må bli enige før OVER).',
      'Kildekritisk refleksjon i praksis (Scene 5: Brakkerykter vs. hemmelig radio).',
      'Forståelse for folkerett og Genèvekonvensjonen (hvorfor offiserer ikke arbeidet, Røde Kors-pakker, krigsforbrytelser).',
      'Lokalt forankret empati for en ung norsk gutt (Halldor var bare 21–23 år).',
    ],
    techStack: [
      'Frontend: React 19 + TypeScript + Tailwind CSS (Slate & Sepia 1940-talls palett)',
      'Lyd: Web Audio API med syntetisert radiosus (squelch), klikk og chimes uten eksterne lydfiler',
      'Tale (valgfritt): Web Speech API for handsfree mikrofon («OVER»-deteksjon)',
      'KI-motor: Gemini 2.5/Flash via serverless proxy med strenge systeminstruksjoner',
      'Eksport: PDF / Word / Utklippstavle for lærerens vurderingsarbeid',
    ],
    teacherTools: [
      'Tidsur med anbefalt fremdrift per scene (1–1,5 min per scene).',
      'Knapp for «Hopp over vakt-scenen» ved tidsnød.',
      'Lærer-ark med fasit på historiske fakta vs fiksjon («(diktet)»-markører).',
      'Ferdig utfylt vurderingsskjema med tre mest synlige kompetansemål.',
    ],
    challengesAndMitigations: [
      {
        challenge: 'Elevene kan bli fjollete eller foreslå urealistiske ting (f.eks. maskingevær, magi, fly).',
        solution: 'Spillveilederen har faste grenser: «Det finnes ikke i leiren. Hva har Halldor egentlig tilgjengelig?»',
      },
      {
        challenge: 'Elevene kan glemme å si OVER eller snakke i munnen på hverandre.',
        solution: 'Visuelt pulserende radio-indikator: «Venter på OVER...» og kort ett-ords svar «Lytter.» inntil de er enige.',
      },
      {
        challenge: 'Elevene tar dødsvalg tidlig og opplever nederlag.',
        solution: 'Rask mulighet for omstart fra samme scene, samt en pedagogisk forklaring på reglene vaktene opererte under.',
      },
    ],
    promptTemplateKey: 'builder_walkie_talkie',
  },
  {
    id: 'kartlab_kildejakt',
    title: 'Idé 2: «Stalag Luft III Kartlab & Kildejakt»',
    tagline: 'Interaktiv kart-etterforskning og historisk kildekritisk laboratorium.',
    category: 'Undersøkende Læring & Kildekritikk',
    targetAudience: '10. trinn og VGS historie / tverrfaglig samfunnsfag',
    description:
      'En etterforsknings-app hvor elevene veksler mellom et interaktivt 1944-kart over Stalag Luft III (leirplan, brakke 104, sjaktene Tom, Dick, Harry, vakttårn) og et kildearkiv. Elevene må avdekke hva som var fakta, hva som var leirrykter, hva tyskerne trodde, og hva Hollywood senere fant opp i filmen fra 1963.',
    coreMechanics: [
      'Interaktivt leirkart: Zoombar plantegning av leiren med geofencede soner (varselstråden, hundepatruljene, seismiske mikrofoner).',
      'Kildekritisk filterbord: Elevene analyserer 6 historiske dokumenter (Askøy-folketelling, brev fra Halldor, Luftwaffe-rapport, Røde Kors-tilsyn, hemmelig radiologg).',
      'Hollywood vs. Virkelighet: Sammenligningsverktøy der elevene «faktasjekker» The Great Escape (1963) mot virkelige beretninger fra Müller og Bergsland.',
      'Fluktsimulator: Tidslinje over natten 24.–25. mars med sanntids hendelseslogg (flyalarm, strømbrudd, ras i tunnelen, oppdagelsen).',
    ],
    pedagogicalBenefits: [
      'Direkte oppfyllelse av kompetansemålet om framstillinger av fortiden (film vs. realitet).',
      'Trener primær- vs sekundærkilde-analyse.',
      'Romlig og geografisk forståelse av krigens logistikk og geografi.',
    ],
    techStack: ['React + SVG Interactive Camp Map', 'Lucide Icons', 'Canvas / HTML5 Zoom-Pan', 'Local Storage fremdrift'],
    teacherTools: ['Løsningsnøkkel for kilder', 'Differensierte oppgavesett for tilpasset opplæring'],
    challengesAndMitigations: [
      {
        challenge: 'For mye tekst og kildemateriale kan virke overveldende for noen elever.',
        solution: 'Kildene er bearbeidet i korte, autentiske utdrag med ordforklaringer ved hover.',
      },
    ],
    promptTemplateKey: 'builder_kartlab',
  },
  {
    id: 'laerer_cockpit',
    title: 'Idé 3: «Lærer-Cockpit: KI-Klasseroms-Hub»',
    tagline: 'Sanntidsovervåkning og formativ vurderingsstøtte for læreren i spill-økten.',
    category: 'Lærerverktøy & Læringsanalyse',
    targetAudience: 'Historielærere i ungdomsskolen (vises på lærerskjerm/Smartboard)',
    description:
      'Når en hel klasse på 30 elever (15 par) spiller Halldors-rollespillet samtidig, gir dette læreren full oversikt i sanntid. Læreren ser hvilket trinn hver gruppe er på, hvem som sitter fast, hvem som har tatt tilbakeslag eller dødsvalg, og får autogenererte LK20-kompetanseprofiler for hele klassen samlet.',
    coreMechanics: [
      'Gruppeoversikt i sanntid: 15 par-kort med status (Scene 1–6, tillitsstige 0–4, tid brukt).',
      'Varslingssystem: Flagger automatisk «Gruppe 4 står fast på Scene 4 (>3 min)» eller «Gruppe 7 tok dødsvalg i Scene 1».',
      'Felles pauseknapp: Læreren kan fryse spillet for felles plenumssamtale.',
      'Klasse-statistikk: Hvilke valg tok klassen mest? Hvor mange stolte på radioen vs. ryktet i Scene 5?',
      'Ett-klikks vurderingseksport: Eksporterer vurderingstakster rett inn i Skooler / Visma / Teams.',
    ],
    pedagogicalBenefits: [
      'Frigjør læreren fra manuell overvåking og lar hen fokusere på pedagogisk veiledning av grupper som sliter.',
      'Gir empirisk grunnlag for en fantastisk oppsummeringstime i plenum etter spillet.',
    ],
    techStack: ['WebSockets / Supabase Realtime / Firebase', 'React Dashboard', 'Recharts for klasseanalyse'],
    teacherTools: ['Fjernstyring av spillklokke', 'Egendefinerte kompetansekriterier'],
    challengesAndMitigations: [
      {
        challenge: 'Krever enkel pålogging uten at elevene må opprette brukerkontoer.',
        solution: '6-sifret PIN-kode eller QR-kode (Kahoot-stil) for umiddelbar par-tilkobling.',
      },
    ],
    promptTemplateKey: 'builder_teacher_hub',
  },
  {
    id: 'askoy_minnereise',
    title: 'Idé 4: «Fra Askøy til Stalag Luft III: Den Norske Minnereisen»',
    tagline: 'Lokalhistorisk og biografisk dypdykk i Halldor Espelid og norske motstandshelter.',
    category: 'Biografisk Storytelling & Lokalhistorie',
    targetAudience: 'Vestland / Askøy-skoler, og historieundervisning i hele Norge',
    description:
      'En fortellende opplevelses-app som kobler den lokale gutten fra Askøy til de dramatiske verdenskrigshendelsene. Elevene følger Halldors reise: Fotturene på Hardangervidda som tenåring, flukten med skøyta «Traust» høsten 1940, Spitfire-trening i Little Norway i Canada, luftkampene over den engelske kanal, fangeleiren, og den tragiske henrettelsen beordret av Hitler.',
    coreMechanics: [
      'Interaktiv tidslinje og kartreise: Fra Askøy → Hardangervidda → Nordsjøen → Little Norway → 331 Squadron → Stalag Luft III → Flensburg → Poznań.',
      'Minner og brev: Autentiske brev Halldor sendte hjem til familien på Askøy.',
      'Menneskeskjebner: Historien om søsteren Ingrid Espelid Hovig og broren Mons, og hvordan krigen preget en hel familie.',
      'Genèvekonvensjonens rettsoppgjør: Hvordan britiske etterforskere sporet opp Gestapo-mennene etter krigen og stilte dem for krigsforbryterdomstol.',
    ],
    pedagogicalBenefits: [
      'Gjør historien nær, personlig og emosjonelt engasjerende.',
      'Viser koblingen mellom lokalhistorie og andre verdenskrig som global hendelse.',
      'Belyser Norges flyvåpen og Nordsjøfarten («Traust»).',
    ],
    techStack: ['React Storytelling Scroll / Scrollytelling', 'Audio narration', 'High-res historiske arkivbilder'],
    teacherTools: ['Diskusjonsspørsmål om heltemot, offer og krigens pris'],
    challengesAndMitigations: [
      {
        challenge: 'Kan bli for dystert mot slutten.',
        solution: 'Fokus på Halldors mot, vennskapet med Nils Fuglesang, og etterkrigstidens rettferdighet og minnekultur.',
      },
    ],
    promptTemplateKey: 'builder_minnereise',
  },
];
