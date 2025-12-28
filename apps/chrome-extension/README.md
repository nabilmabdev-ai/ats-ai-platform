# ATS AI Sourcing Extension

A Chrome Extension to source candidates from LinkedIn and send them directly to the ATS AI Platform.

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select this folder (`apps/chrome-extension`).

## Usage

1. Navigate to a LinkedIn profile (e.g., `https://www.linkedin.com/in/some-candidate`).
2. Click the ATS AI extension icon in the toolbar.
3. Enter the candidate's email (required to create a unique record).
4. Click **Import Profile**.
5. The extension will scrape the name, location, and full profile text, and send it to your local backend (`http://localhost:3001`).
6. The backend will automatically trigger AI parsing and vectorization.

## Troubleshooting

- Ensure your backend is running (`npm run start:dev` in `apps/backend-core`).
- If you see a "Server Error", check the backend console logs.
- If scraping fails, reload the LinkedIn page.
