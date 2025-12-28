// Background Service Worker
// Handles API requests to avoid CORS issues from content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveCandidate') {
        handleSaveCandidate(request.data, sendResponse);
        return true; // Will respond asynchronously
    }
});

async function handleSaveCandidate(data, sendResponse) {
    try {
        console.log('Sending data to backend:', data);

        // We expect the backend to be running on localhost:3001
        const response = await fetch('http://localhost:3001/candidates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        sendResponse({ success: true, result });
    } catch (error) {
        console.error('Fetch error:', error);
        sendResponse({ success: false, error: error.message });
    }
}
