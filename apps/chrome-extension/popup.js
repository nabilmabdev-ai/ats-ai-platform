document.addEventListener('DOMContentLoaded', () => {
    const scrapeBtn = document.getElementById('scrapeBtn');
    const emailInput = document.getElementById('email');
    const statusDiv = document.getElementById('status');

    scrapeBtn.addEventListener('click', async () => {
        // Basic validation
        const email = emailInput.value.trim();
        if (!email) {
            showStatus('Please enter an email address for the candidate.', 'error');
            return;
        }

        showStatus('Scraping profile...', 'normal');
        scrapeBtn.disabled = true;

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.url.includes('linkedin.com/in/')) {
                showStatus('Please navigate to a LinkedIn profile page.', 'error');
                scrapeBtn.disabled = false;
                return;
            }

            // Execute script to scrape
            // We use tabs.sendMessage if content script is already loaded, 
            // but to be safe we can use scripting.executeScript or ensure content script is there.
            // Since we defined content_scripts in manifest, it should be there.

            chrome.tabs.sendMessage(tab.id, { action: 'scrapeProfile' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    // Fallback: Inject script if not communicating (e.g. page not reloaded since install)
                    showStatus('Please reload the LinkedIn page and try again.', 'error');
                    scrapeBtn.disabled = false;
                    return;
                }

                if (response) {
                    saveToBackend({ ...response, email });
                } else {
                    showStatus('Failed to scrape content.', 'error');
                    scrapeBtn.disabled = false;
                }
            });

        } catch (e) {
            showStatus('Error: ' + e.message, 'error');
            scrapeBtn.disabled = false;
        }
    });

    function saveToBackend(data) {
        showStatus('Sending to ATS Backend...', 'normal');

        chrome.runtime.sendMessage({ action: 'saveCandidate', data }, (response) => {
            if (response && response.success) {
                showStatus('Candidate imported successfully!', 'success');
                setTimeout(() => window.close(), 2000);
            } else {
                const msg = response ? response.error : 'Unknown error';
                showStatus('Upload failed: ' + msg, 'error');
                scrapeBtn.disabled = false;
            }
        });
    }

    function showStatus(text, type) {
        statusDiv.textContent = text;
        statusDiv.className = type;
    }
});
