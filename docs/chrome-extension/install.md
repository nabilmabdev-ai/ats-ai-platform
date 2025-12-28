Here is \*\*`apps/chrome-extension/INSTALL.md`\*\*. This document serves as a user manual and technical guide for the Sourcing Extension, covering installation, usage logic, and troubleshooting.



\*\*\*



\# Chrome Extension: Installation \& Usage Guide



\*\*Name:\*\* ATS AI Sourcing Extension

\*\*Version:\*\* 1.0

\*\*Manifest:\*\* V3



This extension is a specialized sourcing tool designed to scrape candidate data from LinkedIn profiles and inject it directly into the HT Recruitment OS backend.



> \*\*⚠️ Note:\*\* This extension is currently in \*\*Developer Mode\*\* (Sideloaded). It is not available on the Chrome Web Store.



---



\## 1. Prerequisites



Before installing, ensure the following:



1\.  \*\*Google Chrome\*\* (or Chromium-based browser like Brave/Edge).

2\.  \*\*Backend Core is Running:\*\* The extension communicates directly with your local API.

&nbsp;   \*   Ensure `apps/backend-core` is running on `http://localhost:3001`.

&nbsp;   \*   \*Check:\* Visit `http://localhost:3001/api` in your browser. If it connects, you are ready.



---



\## 2. Installation Steps



Since this is a private development extension, you must load it as an "Unpacked" extension.



1\.  \*\*Open Extension Management:\*\*

&nbsp;   \*   Type `chrome://extensions` in your address bar and press Enter.

&nbsp;   \*   Alternatively: Click the Puzzle icon 🧩 -> Manage Extensions.



2\.  \*\*Enable Developer Mode:\*\*

&nbsp;   \*   Toggle the switch labeled \*\*"Developer mode"\*\* in the top-right corner of the page.



3\.  \*\*Load the Extension:\*\*

&nbsp;   \*   Click the button \*\*"Load unpacked"\*\* (top-left).

&nbsp;   \*   Navigate to your project directory.

&nbsp;   \*   Select the folder: `.../your-project/apps/chrome-extension`.



4\.  \*\*Verify:\*\*

&nbsp;   \*   You should see a new card appear: \*\*"ATS AI Sourcing Extension 1.0"\*\*.

&nbsp;   \*   Ensure the toggle is \*\*ON\*\*.

&nbsp;   \*   \*(Optional)\* Pin the extension to your toolbar for easy access.



---



\## 3. How to Use



The extension is designed specifically for \*\*LinkedIn Profiles\*\*. It will not extract data correctly from other websites.



\### Step 1: Navigate to a Profile

Go to any LinkedIn user profile (e.g., `https://www.linkedin.com/in/reidhoffman/`).

\*   \*Note:\* Ensure the page is fully loaded.



\### Step 2: Open the Extension

Click the ATS icon in your toolbar. A popup window will appear.



\### Step 3: Input Required Data

\*   \*\*Email:\*\* Since LinkedIn hides emails behind connections/privacy settings, you \*\*must\*\* manually enter the candidate's email address.

&nbsp;   \*   \*Why?\* The system uses Email as the unique identifier for candidates.



\### Step 4: Import

Click \*\*"Import Profile"\*\*.

1\.  \*\*Scraping:\*\* The extension reads the DOM (Name, Location, About section).

2\.  \*\*Sending:\*\* It sends a POST request to `localhost:3001/candidates`.

3\.  \*\*Processing:\*\* The backend receives the data, queues it for AI Vectorization, and creates the profile.



\*\*Success:\*\* You will see a green success message. The popup will close automatically after 2 seconds.



---



\## 4. Technical Architecture



This extension uses \*\*Manifest V3\*\* standards.



\### Components



| File | Responsibility |

| :--- | :--- |

| `manifest.json` | Configuration. Defines permissions (`activeTab`, `scripting`) and host permissions (`localhost`). |

| `content.js` | \*\*The Scraper.\*\* Injected into the LinkedIn tab. It reads the DOM (HTML) to find `h1` (Name), location elements, and the body text. |

| `background.js` | \*\*The Bridge.\*\* Handles the API network request. This Service Worker bypasses some CORS restrictions by running in the background context. |

| `popup.html/js` | \*\*The UI.\*\* The small window where you enter the email and click "Import". |



\### Data Flow

1\.  \*\*User\*\* clicks "Import" in `popup.js`.

2\.  `popup.js` sends a message `scrapeProfile` to the active tab.

3\.  `content.js` executes, scrapes the DOM, and returns a JSON object.

4\.  `popup.js` receives the data, adds the manual Email, and sends a message `saveCandidate` to the background.

5\.  `background.js` executes `fetch('http://localhost:3001/candidates')`.

6\.  \*\*Backend\*\* returns the new Candidate ID.



---



\## 5. Troubleshooting



\### 🔴 Error: "Failed to scrape content"

\*   \*\*Cause:\*\* You are likely not on a LinkedIn Profile page, or LinkedIn has changed their CSS class names.

\*   \*\*Fix:\*\* Refresh the page. Ensure the URL contains `/in/`.



\### 🔴 Error: "Server Error: Failed to fetch"

\*   \*\*Cause:\*\* The extension cannot reach your backend.

\*   \*\*Fix:\*\*

&nbsp;   1.  Verify `apps/backend-core` is running.

&nbsp;   2.  Check if `http://localhost:3001` is accessible in your browser.

&nbsp;   3.  Check browser console (Right click popup -> Inspect) for CORS errors, though `host\_permissions` should handle this.



\### 🔴 Error: "Candidate with this email already exists"

\*   \*\*Cause:\*\* The backend prevents duplicate emails to maintain data integrity.

\*   \*\*Fix:\*\* Go to the Dashboard and search for that email; the candidate is already in your database.



\### 🔄 Updating the Extension

If you modify code in `apps/chrome-extension`:

1\.  Go to `chrome://extensions`.

2\.  Find the ATS Extension card.

3\.  Click the \*\*Refresh\*\* icon (circular arrow).

4\.  Reload your LinkedIn tab.



---



\## 6. Permissions Explained



\*   `activeTab`: Required to inject the scraper script into the current page when you click the icon.

\*   `scripting`: Required to execute code within the tab context.

\*   `host\_permissions`: `http://localhost:3001/\*` - Explicitly allows the extension to talk to your local API without strict CORS blocking.

