const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5002/api';

async function runTests() {
  console.log('--- STARTING PHASE 5 RUNTIME VALIDATION ---');
  
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritech');
  
  let token = '';
  let userId;
  
  try {
    const userEmail = `test_p5_${Date.now()}@test.com`;
    const reg = await axios.post(`${BASE_URL}/auth/register`, { name: 'Test P5', email: userEmail, password: 'password', phone: '1234567891' });
    token = reg.data.token;
    console.log('[PASS] Authentication');
  } catch (err) {
    console.error('[FAIL] Authentication', err.response?.data || err.message);
    process.exit(1);
  }

  const authAxios = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  try {
    const dcRes = await authAxios.get('/intelligence/data-center');
    if (dcRes.data.animals && dcRes.data.profitability30d) {
      console.log('[PASS] Data Center API');
    } else {
      console.log('[FAIL] Data Center API returned malformed data');
    }
  } catch(e) {
    console.log('[FAIL] Data Center API', e.message);
  }

  try {
    const qualityRes = await authAxios.get('/intelligence/quality');
    if (qualityRes.data.overallScore !== undefined) {
      console.log('[PASS] Data Quality Engine API');
    } else {
      console.log('[FAIL] Data Quality Engine API returned malformed data');
    }
  } catch(e) {
    console.log('[FAIL] Data Quality Engine API', e.message);
  }

  try {
    const analRes = await authAxios.get('/intelligence/analytics?period=monthly');
    if (analRes.data.milkTrends) {
      console.log('[PASS] Analytics Pipeline API');
    } else {
      console.log('[FAIL] Analytics Pipeline API returned malformed data');
    }
  } catch(e) {
    console.log('[FAIL] Analytics Pipeline API', e.message);
  }
  
  try {
    const dbRes = await authAxios.post('/intelligence/dataset/build');
    if (dbRes.data.dataset) {
      console.log('[PASS] ML Dataset Builder API');
    } else {
      console.log('[FAIL] ML Dataset Builder API returned malformed data');
    }
  } catch(e) {
    console.log('[FAIL] ML Dataset Builder API', e.message);
  }

  try {
    const expRes = await authAxios.get('/intelligence/export');
    if (expRes.data && typeof expRes.data === 'string' && expRes.data.includes('Date,Animal Tag')) {
      console.log('[PASS] CSV Export API');
    } else {
      console.log('[FAIL] CSV Export API returned malformed data');
    }
  } catch(e) {
    console.log('[FAIL] CSV Export API', e.message);
  }

  await mongoose.disconnect();
  console.log('--- END PHASE 5 VALIDATION ---');
}

runTests();
