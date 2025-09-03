# GamersClub Match Downloader

A Chrome extension that allows you to download complete match data from GamersClub in a structured JSON format.  
It captures raw data from the platform and reformats it into a clean, developer-friendly structure suitable for dashboards, analytics, and integrations.

---

## Features

- Injects a "Download Data" button directly into the match page.  
- Captures the full JSON payload returned by GamersClub and converts it into the following format:
  ```json
  {
    "match": { ... },
    "players": [ ... ]
  }
  ```
- Supports two modes:
  - Manual: trigger download via button click.  
  - Automatic: mark for download on the next page reload.  
- Generates a local file named `gamersclub_match_<id>.json`.

---

## Installation (Development Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/rafactx/gc-match-downloader.git
   cd gc-match-downloader
   ```
2. Open Chrome and navigate to `chrome://extensions/`.  
3. Enable **Developer mode** (top right corner).  
4. Click **Load unpacked** and select the project directory.  
5. Navigate to a GamersClub match page (`/lobby/match/<id>`) and use the button that appears on the top-right corner.

---

## Project Structure

- `manifest.json` → extension definition and permissions.  
- `background.js` → listens for requests, captures match data, and forwards it to the content script.  
- `content.js` → injects the UI button, formats the JSON, and triggers the download.  

---
