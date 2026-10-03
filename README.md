# Project Agent-Crew

Ein Management- und Orchestrierungs-Spiel, bei dem du als "Orchestrator" ein Team aus intelligenten KI-Agenten leitest (basierend auf React, TypeScript und Vite).

## 🎮 Spielprinzip

1. **Deine Rolle als Orchestrator:** Du bist der "Orchestrator". Zu Beginn des Spiels packst du vielleicht noch selbst mit an, aber im späteren Verlauf geht es primär darum, Aufgaben an deine Agenten (deine Kollegen / Crew) zu delegieren und diese intelligent zu koordinieren.
2. **Kommando-Zentrale (Chat-Interface):** Die Interaktion mit deinem Team findet über ein Terminal im Chat-Format statt. Du wählst ein Crew-Mitglied aus und schreibst ihm direkte Anweisungen.
3. **Dynamische KI-Entscheidungen:** Anstatt starrer Schlüsselwörter entscheidet ein LLM im Hintergrund aus dem Kontext deiner Nachrichten, welche Aktionen oder Missionen der Agent ausführen soll.
4. **Proaktivität & Vorschläge:** Die Agenten denken mit! Sie schlagen von sich aus die nächsten sinnvollen Schritte vor – oft musst du einfach nur noch mit einem kurzen "Ja" bestätigen. Wenn du längere Zeit nicht im Chat aktiv warst, melden sich die Agenten auch proaktiv bei dir.
5. **Wirtschaft & Fortschritt:** Durch erfolgreiche Missionen sammeln die Agenten Beute (z.B. ins Inventar) und erwirtschaften Geld, wodurch du dein Setup weiter ausbauen und noch effizienter orchestrieren kannst.

## 🛠 Technologien

- **Frontend Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Animationen:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linting:** [Oxlint](https://oxc.rs/docs/guide/usage/linter)

## 📦 Installation & Start

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```
   Die App ist dann standardmäßig unter `http://localhost:5173` erreichbar.

## 📜 Skripte

- `npm run dev`: Startet den lokalen Entwicklungsserver.
- `npm run build`: Kompiliert TypeScript und erstellt den Produktions-Build.
- `npm run lint`: Überprüft den Code mit Oxlint.
- `npm run preview`: Startet eine lokale Vorschau des Produktions-Builds.

## 🗂 Projektstruktur

- `src/components/`: Wiederverwendbare UI-Komponenten
- `src/store/`: Zustand-Store für lokales State-Management
- `src/types/`: TypeScript-Typdefinitionen
- `src/assets/`: Statische Assets (Bilder etc.)
