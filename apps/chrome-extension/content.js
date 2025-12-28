// Content Script
// Scrapes the LinkedIn profile page

console.log('ATS AI Sourcing Content Script Loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeProfile') {
        const data = scrapeProfile();
        sendResponse(data);
    }
});

function scrapeProfile() {
    // Simple extraction strategies

    // 1. Name: usually the first h1
    const nameEl = document.querySelector('h1');
    let fullName = nameEl ? nameEl.innerText.trim() : "Unknown Candidate";

    // Split name
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    // 2. Location
    // Often in the top card, e.g. "San Francisco Bay Area"
    // Keep it simple: look for common classes or just rely on raw text vectorization
    let location = "Unknown";
    const locEl = document.querySelector('.text-body-small.inline.t-black--light.break-words');
    if (locEl) location = locEl.innerText.trim();

    // 3. Email
    // If user is connected, it might be in "Contact Info".
    // Note: This often requires clicking the "Contact info" link to load the modal.
    // We will assume "unknown" or let the recuiter fill it, OR parse it from the body if visible.
    // For now, generate a placeholder if not found.
    const email = "pending_parse_" + Date.now() + "@unknown.com";

    // 4. Raw Text
    const rawText = document.body.innerText;

    // 5. LinkedIn URL
    const linkedinUrl = window.location.href;

    return {
        firstName,
        lastName,
        email, // This needs to be real for the backend to not duplicate, but we can't easily get it.
        // However, if we don't provide a unique email, the backend might reject duplicates based on email.
        // If we use a placeholder, we might create duplicates.
        // Better strategy: ask user in Popup for email if not found?
        // For this MVP, we send what we have.
        location,
        linkedinUrl,
        resumeText: rawText
    };
}
