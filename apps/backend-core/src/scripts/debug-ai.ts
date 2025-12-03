import axios from 'axios';

async function main() {
  const aiServiceUrl = 'http://localhost:8001';

  const payload = {
    resume_text: `Alice Benali
Bilingual Customer Service & Sales Specialist (English–French)
Casablanca, Morocco
Phone: +212 6 45 23 90 11
Email: alice.benali@example.com
Professional Summary
Dynamic and customer-focused Bilingual Customer Service & Sales Specialist with 4+ years of experience in fast-paced retail, e-commerce, and SaaS environments. Skilled in managing high-volume customer interactions, driving sales conversions, resolving complex issues, and delivering exceptional customer experiences in both English and French. Known for strong communication, active listening, and a proactive, solution-oriented approach.
Core Skills
Customer Support (Phone, Email, Live Chat)
Bilingual Communication (English & French)
Sales & Upselling Techniques
CRM Tools: Zendesk, HubSpot, Freshdesk, Salesforce`,
    job_description: `We are seeking a highly motivated and professional Bilingual Customer Service and Sales Specialist to join our dynamic team. The ideal candidate will be the first point of contact for customers, responsible for delivering an outstanding service experience while proactively identifying opportunities to promote and sell relevant products and services. This role requires exceptional communication skills in both English and French to effectively address customer needs and drive business growth.`,
    criteria: {
      requiredSkills: [
        'Customer Service',
        'Communication',
        'Problem Solving',
        'Bilingual',
        'English',
        'French',
      ],
      niceToHaves: ['Sales', 'CRM', 'Zendesk', 'HubSpot'],
      scoringWeights: { skills: 0.5, experience: 0.3, education: 0.2 },
    },
  };

  try {
    console.log('Calling AI Service at', aiServiceUrl);
    const res = await axios.post(`${aiServiceUrl}/screen-candidate`, payload);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
    if (e.response) {
      console.error('Data:', e.response.data);
    }
  }
}

main();
