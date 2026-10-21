// Historical archive documents and map excerpts for Stalag Luft III & Halldor Espelid
// Designed to keep students' eyes and attention locked on the historical reality

export interface ArchiveItem {
  id: string;
  sceneId: number;
  category: 'kart' | 'dokument' | 'skisse' | 'etterretning';
  title: string;
  subtitle: string;
  dateOrCode: string;
  description: string;
  historicalFact: string;
  badgeLabel: string;
  svgType: 'wire_map' | 'committee_doc' | 'red_cross_manifest' | 'barrack_cross_section' | 'radio_schematic' | 'tunnel_blueprint';
}

export const HISTORICAL_ARCHIVE_ITEMS: Record<number, ArchiveItem> = {
  1: {
    id: 'arch-1',
    sceneId: 1,
    category: 'kart',
    title: 'Situasjonskart: Nordleiren & Varseltråden',
    subtitle: 'Stalag Luft III • Sagan (Nedre Schlesien)',
    dateOrCode: 'KARTREF: SL3-NORTH-1943',
    badgeLabel: 'Autentisk leirkart',
    description: 'Den hvite varseltråden («Warning Wire») var spent opp 15 cm over bakken, ca. 5 meter innenfor det doble piggtrådgjerdet.',
    historicalFact: 'Tyske vakter i vakttårnene («Goon Boxes») hadde stående ordre om å skyte enhver fange som trådte over tråden uten forvarsel.',
    svgType: 'wire_map',
  },
  2: {
    id: 'arch-2',
    sceneId: 2,
    category: 'dokument',
    title: 'Falsknerkomiteens Arkiv: «Ausweis»',
    subtitle: 'Seksjon for falske dokumenter & sivile klær',
    dateOrCode: 'DOK-REF: X-PASS-NOR-04',
    badgeLabel: 'Hemmelig dokument',
    description: 'Rømningskomiteen (kalt «X») forfalsket over 400 tyske identitetskort, reiseordrer og jernbanebilletter i leiren.',
    historicalFact: 'Blekk ble kokt ut av skokrem og teblader. Stempler ble sirlig gravert for hånd i gummisåler og såpestykker.',
    svgType: 'committee_doc',
  },
  3: {
    id: 'arch-3',
    sceneId: 3,
    category: 'etterretning',
    title: 'Røde Kors Pakkemanifest & Delingsprotokoll',
    subtitle: 'Brakkelagets felles forsyningsliste',
    dateOrCode: 'GENEVE-REF: ICRC-1943-PKG',
    badgeLabel: 'Rasjonsliste',
    description: 'Tyskernes offisielle leirrasjon ga bare ca. 1 000 kalorier daglig (kålrot og tørt sagmuggbrød). Røde Kors-pakkene holdt fangene i live.',
    historicalFact: 'Brakkelaget delte all hermetikk og sjokolade på milligrammet. Kondensert melk og sjokolade ble spart i hemmelighet til fluktproviant.',
    svgType: 'red_cross_manifest',
  },
  4: {
    id: 'arch-4',
    sceneId: 4,
    category: 'skisse',
    title: 'Tverrsnitt: Brakke 104 & Den Skjulte Ovnen',
    subtitle: 'Sjakten ned til tunnelen «Harry»',
    dateOrCode: 'TEKNISK TEGN: SHAFT-104-H',
    badgeLabel: 'Konstruksjonsskisse',
    description: 'Sjaktåpningen til tunnelen var skjult under en 150 kg tung støpejernsovn i et hjørne av brakke 104, montert på glideskinner.',
    historicalFact: 'Tyske vakter («Ferret» / ildere) krøp jevnlig under brakkene med stålspyd for å lytte og stikke etter hemmelige sjakter.',
    svgType: 'barrack_cross_section',
  },
  5: {
    id: 'arch-5',
    sceneId: 5,
    category: 'etterretning',
    title: 'Kodelogg: Den Hemmelige BBC-Mottakeren',
    subtitle: 'Brakkeradioen gjemt inni et hult trekkspill',
    dateOrCode: 'SIGNAL-LOGG: BBC-NEWS-LONDON',
    badgeLabel: 'Signaletterretning',
    description: 'Fangene bygde en hemmelig kortbølgeradio fra deler smuglet inn eller byttet til seg fra tyske vakter med sjokolade.',
    historicalFact: 'Nyheter fra BBC ble skrevet ned i kodeskrift og hvisket fra brakke til brakke for å stoppe tyske desinformasjonsrykter.',
    svgType: 'radio_schematic',
  },
  6: {
    id: 'arch-6',
    sceneId: 6,
    category: 'skisse',
    title: 'Ingeniørplan: Tunnelen «Harry» i Snøen',
    subtitle: '102 meter lengde • 9 meter under bakken',
    dateOrCode: 'PLAN: HARRY-LENGTH-102M',
    badgeLabel: 'Fluktprofil 25. mars',
    description: 'Tunnelen ble avstivet med over 4 000 sengefjøler. En manuell luftpumpe bygget av «Klim»-melkebokser pumpet frisk luft gjennom stoffrør.',
    historicalFact: 'Utgangen endte dessverre ca. 30 meter for kort – i åpent snødekke utenfor skogkanten, rett under vakttårnets lyskaster.',
    svgType: 'tunnel_blueprint',
  },
};
