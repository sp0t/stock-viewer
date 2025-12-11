# Stock Viewer (React + Vite)

Minimal, mobile-friendly stock table fed by XLSX uploads. Designed to drop onto a standard cPanel/LAMP host via a static build (no server code required).

## Quick start (local)

1. Install Node 18+ and npm.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open the shown URL (default http://localhost:5173).

## Build for production

```bash
npm run build
```

Upload the generated `dist/` folder to your cPanel host (any static hosting works). If deploying under a subfolder, keep the `dist` contents together.

## Using the XLSX importer

- Click **Upload XLSX** and choose your Excel file.
- The first worksheet is read; expected columns (case-insensitive): `Make`, `Model`, `Quantity`, `Grading`.
- Data loads client-side and replaces the in-memory table. Initial view shows sample rows so the page never looks empty.

## File layout

- `src/App.jsx` – UI + XLSX parsing with `xlsx`.
- `src/index.css` – styling, sticky header table with mobile-friendly cards on narrow screens.
- `vite.config.js` – Vite + React config.

## Notes

- No backend or database is required. If you later need persistent storage or cron-based ingestion, you can add a small API endpoint that stores the parsed JSON to disk/DB and serve it to the React app.
- The table is intentionally uncluttered: no filters/pagination yet, to keep it fast on phones.

