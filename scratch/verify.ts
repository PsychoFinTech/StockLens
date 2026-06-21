import axios from 'axios';

async function test() {
  try {
    console.log('Sending request to /api/market/movers...');
    const r = await axios.get('http://localhost:3000/api/market/movers');
    console.log('Response keys:', Object.keys(r.data));
    console.log('Losers length:', r.data.losers?.length);
    if (r.data.losers && r.data.losers.length > 0) {
      console.log('First loser:', r.data.losers[0]);
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

test();
