export const translations = {
  en: {
    missionAccomplished: "Mission accomplished. I've returned with salvaged goods.",
    launchSequence: "Initiating launch sequence. ETA 5 seconds.",
    alreadyOnMission: "I am currently on a mission.",
    acknowledged: "Acknowledged.",
    agentCrew: "Agent Crew",
    dashboard: "Dashboard",
    chat: "Chat",
    cargo: "Cargo",
    profile: "Profile",
    messagePlaceholder: "Message...",
    noItems: "No items collected yet",
    itemsCount: "items",
    active: "Active",
    agents: "Agents",
    totalBalance: "Total Balance",
    statistics: "Statistics",
    uptime: "Uptime",
    itemsFound: "Items Found",
    cargoValue: "Cargo Value",
    inProgress: "In progress...",
    quantumProcessor: "Quantum Processor",
    scrapMetal: "Scrap Metal",
    rare: "rare",
    common: "common",
    sparky: "Sparky (Engineer)",
    nova: "Nova (Navigator)",
    initialChat: "Captain. Core temperature is stable, but we need more scrap to upgrade the hyperdrive.",
    toolMissionStarted: "Tool used: started mission for",
    toolBusy: "I can't start a mission, I'm already busy!",
    toolListed: "Tool used: Listed",
    toolNotFound: "I couldn't find",
    toolFor: "for",
    toolInCargo: "in the cargo bay.",
    errorLLM: "Error communicating with LLM engine.",
    shop: "Online Shop",
    market: "Market",
    buy: "Buy",
    price: "Price",
    seller: "Seller",
    noMarketItems: "No items currently on the market.",
    agentSearch: "Agent Search",
    budget: "Budget",
    searchQuery: "Search Query",
    search: "Search",
    buySuccess: "Successfully purchased!",
    buyFail: "Not enough money or item unavailable.",
    searchPlaceholder: "e.g. Plasma Injector",
    recommendedActions: "Recommended Actions",
    actionOrchestrate: "Orchestrate Agents",
    actionOrchestrateDesc: "Assign new missions to your idle agents.",
    actionNewInfo: "Intel Update",
    actionNewInfoDesc: "New high-value targets detected in sector 7.",
    community: "Community",
    realUsers: "Active Players",
    revenue: "Revenue"
  },
  de: {
    missionAccomplished: "Mission erfolgreich. Ich bin mit geborgenen Gütern zurückgekehrt.",
    launchSequence: "Startsequenz wird eingeleitet. ETA 5 Sekunden.",
    alreadyOnMission: "Ich bin derzeit auf einer Mission.",
    acknowledged: "Verstanden.",
    agentCrew: "Agenten Crew",
    dashboard: "Übersicht",
    chat: "Chat",
    cargo: "Fracht",
    profile: "Profil",
    messagePlaceholder: "Nachricht...",
    noItems: "Noch keine Gegenstände gesammelt",
    itemsCount: "Gegenstände",
    active: "Aktiv",
    agents: "Agenten",
    totalBalance: "Gesamtguthaben",
    statistics: "Statistiken",
    uptime: "Betriebszeit",
    itemsFound: "Gefundene Gegenstände",
    cargoValue: "Frachtwert",
    inProgress: "In Bearbeitung...",
    quantumProcessor: "Quantenprozessor",
    scrapMetal: "Altmetall",
    rare: "selten",
    common: "gewöhnlich",
    sparky: "Sparky (Ingenieur)",
    nova: "Nova (Navigator)",
    initialChat: "Captain. Die Kerntemperatur ist stabil, aber wir brauchen mehr Schrott, um den Hyperantrieb zu verbessern.",
    toolMissionStarted: "Werkzeug benutzt: Mission gestartet für",
    toolBusy: "Ich kann keine Mission starten, ich bin bereits beschäftigt!",
    toolListed: "Werkzeug benutzt: Eingestellt",
    toolNotFound: "Ich konnte",
    toolFor: "für",
    toolInCargo: "nicht in der Frachtbucht finden.",
    errorLLM: "Fehler bei der Kommunikation mit der LLM-Engine.",
    shop: "Online Shop",
    market: "Markt",
    buy: "Kaufen",
    price: "Preis",
    seller: "Verkäufer",
    noMarketItems: "Derzeit keine Gegenstände auf dem Markt.",
    agentSearch: "Agenten Suche",
    budget: "Budget",
    searchQuery: "Suchbegriff",
    search: "Suchen",
    buySuccess: "Erfolgreich gekauft!",
    buyFail: "Nicht genug Geld oder Gegenstand nicht verfügbar.",
    searchPlaceholder: "z.B. Quantenprozessor",
    recommendedActions: "Empfohlene Aktionen",
    actionOrchestrate: "Agenten orchestrieren",
    actionOrchestrateDesc: "Weise deinen inaktiven Agenten neue Missionen zu.",
    actionNewInfo: "Neues Info-Update",
    actionNewInfoDesc: "Neue hochkarätige Ziele in Sektor 7 entdeckt.",
    community: "Community",
    realUsers: "Aktive Spieler",
    revenue: "Umsatz"
  }
};

type Language = 'en' | 'de';

let currentLanguage: Language | null = null;

export const getLanguage = (): Language => {
  if (currentLanguage) return currentLanguage;
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.split('-')[0];
    if (lang === 'en') {
      currentLanguage = 'en';
      return 'en';
    }
  }
  currentLanguage = 'de';
  return 'de';
};

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const t = (key: keyof typeof translations.en): string => {
  const lang = getLanguage();
  return translations[lang][key] || translations.en[key] || key;
};
