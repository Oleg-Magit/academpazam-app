# AcademPazam

Local-first degree progress tracker built with React, TypeScript and Vite.  
Privacy-focused Progressive Web App (PWA).

---

## 🌐 Live Demo
Coming soon via GitHub Pages.

---

## Features

- **Offline First** – Fully functional without internet (IndexedDB + Service Worker).
- **Degree Tracking** – Manage courses, topics and credit progress.
- **Editable Plan** – Customize degree structure and requirements.
- **Bulk Entry** – Quickly paste course lists.
- **PDF Export** – Generate progress reports (Hebrew supported).
- **Data Backup** – Export/Import full JSON backups (Merge or Replace).

---

## Privacy

AcademPazam is completely local-first:
- No accounts
- No tracking
- No analytics
- No backend
- No data leaves your device

All information is stored locally in your browser using IndexedDB.

## 🛠 Tech Stack

- React
- TypeScript
- Vite
- IndexedDB (idb)
- pdf-lib
- vite-plugin-pwa

## 📦 Installation

```bash
npm install
npm run dev

🏗 Production Build
npm run build
npm run preview

📄 PDF & RTL Notes

Requires public/fonts/NotoSansHebrew-Regular.ttf

pdf-lib does not support true bidirectional text.

Hebrew strings use a reversal strategy for readability.

Mixed Hebrew/English text may require manual adjustments.

📤 Import / Export

Export – Saves full plan data as JSON.

Merge – Adds/updates items by ID.

Replace – Replaces entire local database.

📜 License

MIT License © 2026 Oleg-Magit

This project is open-source and available for educational and personal use.