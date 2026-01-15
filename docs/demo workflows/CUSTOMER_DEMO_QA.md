# ❓ Customer Demo Q&A Cheat Sheet

Prepare for these common questions during the "Killer Features" demo.

---

## 🤖 AI & Search

**Q: "How does the AI know a 'Senior' developer from a 'Junior' one if they both have 'Java' on their resume?"**
*   **A**: We don't just match keywords. The AI analyzes the *context*—years of experience, leadership terms ("Managed team", "Led architecture"), and the complexity of projects described. It calculates a semantic score, not just a keyword count.

**Q: "Can I force the system to ONLY find people with 'React'?"**
*   **A**: Yes. You can mix "AI Concept Search" with strict filters. If you type "React" in the Keywords filter, it becomes a hard requirement, while the AI ranks them by quality.

**Q: "Does the AI learn from my hiring decisions?"**
*   **A**: Currently, the AI uses a pre-trained Large Language Model (Google Gemini) optimized for recruitment. We are building a feedback loop where your "Hired" actions will fine-tune the ranking in future updates.

---

## 🔒 Data & Security

**Q: "Where is the data stored? Is it GDPR compliant?"**
*   **A**: Yes. The core database (PostgreSQL) is hosted on your secure privacy-compliant cloud (or on-premise). Resume files are encrypted. We only send anonymized text chunks to the AI provider for processing, never PII like emails/phones if configured strictly.

**Q: "What happens if I upload the same resume twice?"**
*   **A**: The system runs a **Smart Deduplication** check.
    *   **Strict**: Same Email = Rejects upload or asks to Merge.
    *   **Fuzzy**: Same Name + Phone = Flags as "Potential Duplicate".
    *   We prevent database rot before it starts.

**Q: "What if a candidate applies again with a different email?"**
*   **A**: This is common. Our "Fuzzy Match" logic (Name + Phone Number) will catch this. You will see a "Potential Duplicate" alert on their profile. You can then click **"Merge Candidates"** to combine them into one master profile.

**Q: "When I merge two candidates, what happens to their history?"**
*   **A**: Nothing is lost. The system performs a **Smart Merge**:
    *   **Contact Info**: You choose the primary email/phone.
    *   **Applications**: All applications from both profiles are combined into the timeline.
    *   **Notes/Interviews**: All historical activity is preserved.
    *   One candidate, complete history.

---

## ⚙️ Integrations & Workflow

**Q: "We use Outlook, not Google. Does Smart Scheduling work?"**
*   **A**: Yes. The system integrates with both Microsoft 365 (Outlook) and Google Workspace. It reads your "Busy" slots in real-time so candidates can only book free time.

**Q: "Can I customize the Offer Letter template?"**
*   **A**: Absolutely. The templates are standard HTML. You can add your logo, change the legal clauses (CDI/CDD), and adjust the dynamic variables (Salary, Start Date) in the Settings.

**Q: "How do I migrate my 10,000 candidates from my old Excel sheet?"**
*   **A**: We have a **Bulk Import** tool. You upload your Excel file, map the columns (Name, Email, etc.), and the system processes them in the background, applying the same deduplication logic as a manual upload.

---

## 💰 Scalability

**Q: "Is there a limit to how many candidates I can have?"**
*   **A**: The architecture uses **Milvus** (Vector DB) and **Postgres**, both designed for millions of records. We have tested with 500k+ candidates with sub-100ms search times.

**Q: "Can I separate candidates by Department?"**
*   **A**: Yes. You can "Tag" candidates or assign them to specific Job pipelines. Access control can be configured so hiring managers only see candidates for their open roles.
