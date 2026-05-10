const http = require('http');

function request(path, method, headers, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ headers: res.headers, body }));
    });
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  const signupData = JSON.stringify({ name: 'Test', email: 'test12345@test.com', password: 'password123', role: 'MEMBER' });
  
  let res = await request('/api/auth/signup', 'POST', { 'Content-Type': 'application/json' }, signupData);
  let cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
  
  if (!cookie) {
    res = await request('/api/auth/login', 'POST', { 'Content-Type': 'application/json' }, signupData);
    cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0] : '';
  }
  
  const projectData = JSON.stringify({ name: 'Test Proj', description: 'desc' });
  await request('/projects/create', 'POST', { 'Content-Type': 'application/json', 'Cookie': cookie }, projectData);
  
  res = await request('/projects', 'GET', { 'Cookie': cookie });
  const html = res.body;
  const match = html.match(/href="\/projects\/([^"]+)"/);
  if (match) {
    const id = match[1];
    res = await request('/projects/' + id, 'GET', { 'Cookie': cookie });
    console.log(res.body.slice(0, 500));
  } else {
    console.log('No project found in HTML');
  }
}
test();
