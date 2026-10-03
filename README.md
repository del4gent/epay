# ePay

Ein modernes Web-Projekt, basierend auf React, TypeScript und Vite.

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
