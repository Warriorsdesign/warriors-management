async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log("=== DÉBUT DES TESTS D'AUTHENTIFICATION ===");

  async function testLogin(url: string, body: any) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    const cookies = res.headers.get('set-cookie') || '';
    return { status: res.status, data, cookies };
  }

  async function testGet(url: string, cookieStr: string) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: { 'Cookie': cookieStr }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. ESPACE ADMIN (D'abord pour récupérer le matricule client)
  console.log("\n--- TEST ESPACE ADMIN ---");
  console.log("[Test] Mauvais mot de passe Admin");
  const badAdmin = await testLogin('/api/admin/auth/login', { email: 'superadmin@warriors.com', password: 'wrong' });
  console.log(`Result: ${badAdmin.status} - ${JSON.stringify(badAdmin.data)}`);

  console.log("[Test] Bonnes informations Admin");
  const goodAdmin = await testLogin('/api/admin/auth/login', { email: 'superadmin@warriors.com', password: 'SuperAdmin2026!' });
  console.log(`Result: ${goodAdmin.status} - Cookie présent: ${goodAdmin.cookies.includes('admin_auth_token')}`);

  let adminCookie = '';
  if (goodAdmin.cookies) {
    const match = goodAdmin.cookies.match(/(admin_auth_token=[^;]+)/);
    if (match) adminCookie = match[1];
  }

  console.log("[Test] Validation session Admin (/api/admin/auth/me)");
  const adminMe = await testGet('/api/admin/auth/me', adminCookie);
  console.log(`Result: ${adminMe.status} - User: ${adminMe.data.user?.email}, Role: ${adminMe.data.user?.roles}`);

  console.log("[Test] Isolation Admin essayant d'accéder à Client (/api/auth/me)");
  const adminToClient = await testGet('/api/auth/me', adminCookie);
  console.log(`Result: ${adminToClient.status} - Error: ${JSON.stringify(adminToClient.data)}`);

  // Récupérer un utilisateur via l'API pour avoir son matricule
  console.log("[Test] Récupération d'un matricule client pour le test suivant");
  // Let's assume DINS-0001 based on "D institut"
  // Let's try to query /api/admin/organizations
  const orgs = await testGet('/api/admin/organizations', adminCookie);
  if (orgs.status === 200 && orgs.data.data && orgs.data.data.length > 0) {
     // Not sure if users are included, maybe not.
  }

  // 2. ESPACE CLIENT
  console.log("\n--- TEST ESPACE CLIENT ---");
  const clientMatricule = 'DINS2609001';
  
  console.log("[Test] Mauvais mot de passe Client");
  const badClient = await testLogin('/api/auth/login', { matricule: clientMatricule, password: 'wrong' });
  console.log(`Result: ${badClient.status} - ${JSON.stringify(badClient.data)}`);

  console.log("[Test] Bonnes informations Client");
  const goodClient = await testLogin('/api/auth/login', { matricule: clientMatricule, password: 'Password123!' });
  console.log(`Result: ${goodClient.status} - Cookie présent: ${goodClient.cookies.includes('auth_token')}`);

  let clientCookie = '';
  if (goodClient.cookies) {
    const match = goodClient.cookies.match(/(auth_token=[^;]+)/);
    if (match) clientCookie = match[1];
  }

  console.log("[Test] Validation session Client (/api/auth/me)");
  const clientMe = await testGet('/api/auth/me', clientCookie);
  console.log(`Result: ${clientMe.status} - User: ${clientMe.data.user?.email}, Role: ${clientMe.data.user?.roles}`);

  console.log("[Test] Déconnexion Client (/api/auth/logout)");
  const logoutClient = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', headers: { 'Cookie': clientCookie } });
  console.log(`Result: ${logoutClient.status} - Cookies: ${logoutClient.headers.get('set-cookie')}`);
}

runTests().catch(console.error);
