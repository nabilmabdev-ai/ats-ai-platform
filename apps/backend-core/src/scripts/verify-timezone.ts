import axios from 'axios';

const API_URL = 'http://localhost:3333/api';

async function verifyTimezone() {
  try {
    // 1. Create User
    console.log('Creating user with America/New_York (UTC-5)...');
    const createRes = await axios.post(`${API_URL}/users`, {
      email: `test-timezone-${Date.now()}@example.com`,
      fullName: 'Timezone Tester',
      role: 'RECRUITER',
      availability: {
        timezone: 'America/New_York',
        workHours: { start: 9, end: 17 },
      },
    });

    const user = createRes.data;
    if (user.availability.timezone !== 'America/New_York') {
      throw new Error(
        `Failed: Expected America/New_York, got ${user.availability.timezone}`,
      );
    }
    console.log('✅ User created with correct timezone.');

    // 2. Update User
    console.log('Updating user to Asia/Tokyo (UTC+9)...');
    const updateRes = await axios.patch(`${API_URL}/users/${user.id}`, {
      availability: {
        timezone: 'Asia/Tokyo',
        workHours: { start: 10, end: 19 },
      },
    });

    if (updateRes.data.availability.timezone !== 'Asia/Tokyo') {
      throw new Error(
        `Failed: Expected Asia/Tokyo, got ${updateRes.data.availability.timezone}`,
      );
    }
    console.log('✅ User updated with correct timezone.');

    // Cleanup
    await axios.delete(`${API_URL}/users/${user.id}`);
    console.log('Cleanup done.');
  } catch (error: any) {
    console.error('Test Failed:', error.response?.data || error.message);
  }
}

verifyTimezone();
