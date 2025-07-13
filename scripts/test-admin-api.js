// Admin paneli API test script'i
// Bu script admin panelindeki API çağrısını simüle eder

const fs = require('fs');
const path = require('path');

// .env.local dosyasını manuel olarak oku
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function testAdminAPI() {
  try {
    console.log('Admin API test basliyor...');
    
    // Önce login yaparak token alalım
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login basarisiz:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Token alindi:', token ? 'Evet' : 'Hayir');

    // Şimdi admin users API'sini test edelim
    const usersResponse = await fetch('http://localhost:3000/api/admin/users?limit=5&sort=createdAt&order=desc', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Users API status:', usersResponse.status);
    console.log('Users API ok:', usersResponse.ok);

    const usersData = await usersResponse.json();
    console.log('Users API response:', usersData);

    if (usersData.success) {
      console.log('Toplam kullanici sayisi:', usersData.pagination.total);
    } else {
      console.error('Users API hatasi:', usersData.message);
    }

  } catch (error) {
    console.error('Test hatasi:', error);
  }
}

testAdminAPI();