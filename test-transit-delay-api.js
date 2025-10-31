import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3099/v1/api';

async function testTransitDelayAPI() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(
      `${API_BASE_URL}/oauth/access_token`,
      new URLSearchParams({
        username: 'su-admin',
        password: 'InfinityAdmin'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Login successful');
    const accessToken = loginResponse.data.data?.access_token || loginResponse.data.access_token;
    
    if (!accessToken) {
      console.error('❌ No access token received');
      console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    console.log('📝 Token:', accessToken.substring(0, 20) + '...');

    // Step 2: Make API call
    console.log('\n📊 Fetching Transit Delay Report...');
    const apiResponse = await axios.get(
      `${API_BASE_URL}/inventory/getDispatchDelayReport?start_date=2025-09-01&end_date=2025-09-05`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ API Response Structure:');
    console.log('=====================================');
    console.log(JSON.stringify(apiResponse.data, null, 2));
    
    // Analyze the structure
    if (apiResponse.data?.data) {
      const data = apiResponse.data.data;
      console.log('\n📋 Data Analysis:');
      console.log('=====================================');
      console.log('citySummary:', data.citySummary?.length || 0, 'cities');
      console.log('dailyDelayResults:', data.dailyDelayResults?.length || 0, 'days');
      
      if (data.dailyDelayResults && data.dailyDelayResults.length > 0) {
        console.log('\n📅 First day structure:');
        const firstDay = data.dailyDelayResults[0];
        console.log('Entry date:', firstDay.entry_date);
        console.log('Cities in this day:', firstDay.cities?.length || 0);
        
        if (firstDay.cities && firstDay.cities.length > 0) {
          console.log('\n🏙️ First city data:');
          console.log(JSON.stringify(firstDay.cities[0], null, 2));
        }
      }
      
      if (data.citySummary && data.citySummary.length > 0) {
        console.log('\n🏙️ City Summary:');
        data.citySummary.forEach(city => {
          console.log(`City ${city.city_id} (${city.cityName}): avgDelay=${city.avgDelay}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received');
    }
  }
}

testTransitDelayAPI();
