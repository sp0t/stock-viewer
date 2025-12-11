# Stock Viewer (React + Vite + Express)

Minimal, mobile-friendly stock table fed by XLSX uploads with backend support for file persistence.

## Quick start (local)

1. Install Node 18+ and npm.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (frontend only):
   ```bash
   npm run dev
   ```
   Open the shown URL (default http://localhost:5173).

4. Or run with backend server:
   ```bash
   # Terminal 1: Start backend server
   npm run server
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

## Backend Server

The backend server provides file upload functionality:

- **Port**: 4000 (default)
- **Upload endpoint**: `POST /upload`
- **Health check**: `GET /health`

The server saves uploaded XLSX files to `public/sample-stock.xlsx`, which is then loaded by the frontend.

### Running the backend:

```bash
npm run server
# or
npm start
```

## Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

The server will serve the built React app from the `dist/` folder and handle file uploads.

## Using the XLSX importer

1. Navigate to `/admin` route to access the upload button
2. Click **Upload XLSX** and choose your Excel file
3. The file will be uploaded to the server and saved as `public/sample-stock.xlsx`
4. The table will automatically reload with the new data

Expected columns (case-insensitive): `Make`, `Model`, `Quantity`, `Grading`, `Price Enquiry`

## File layout

- `src/App.jsx` – UI + XLSX parsing with `xlsx`
- `src/index.css` – styling, sticky header table with mobile-friendly cards
- `server.js` – Express backend server with file upload endpoint
- `vite.config.js` – Vite + React config
- `public/sample-stock.xlsx` – Stock data file (created on upload)

## Features

- Mobile-responsive design with 1-column layout
- Search functionality across all fields
- WhatsApp integration for price enquiries
- Backend file upload and persistence
- Automatic data reload after upload

