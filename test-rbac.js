const BASE = 'http://localhost:3000';

let passed = 0, failed = 0;

function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  PASS: ' + name); }
  else { failed++; console.log('  FAIL: ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : '')); }
}

async function req(method, path, opts) {
  const token = opts && opts.token;
  const body = opts && opts.body;
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

(async () => {
  let r = await req('POST', '/auth/login', { body: { email: 'admin@test.ru', password: 'Admin123!' } });
  ok('Вход админа: 200 и role=admin', r.status === 200 && r.data.role === 'admin', r);
  const adminToken = r.data && r.data.token;

  const email = 'viewer@test.ru';
  const password = 'View3rPass!';
  r = await req('POST', '/auth/register', { body: { email, password } });
  ok('Регистрация: 201 и role=user (или 409 если уже есть)', (r.status === 201 && r.data.role === 'user') || r.status === 409, r);

  r = await req('POST', '/auth/login', { body: { email, password } });
  ok('Вход юзера: 200 и role=user', r.status === 200 && r.data.role === 'user', r);
  const userToken = r.data && r.data.token;

  r = await req('GET', '/tickets');
  ok('GET /tickets без токена -> 401', r.status === 401, r);

  r = await req('POST', '/tickets', { token: userToken, body: { numbers: [3, 11, 19, 27, 35, 43] } });
  ok('Покупка билета: 201, userId привязан', r.status === 201 && r.data.userId != null, r);
  const myTicketId = r.data && r.data.id;

  r = await req('GET', '/tickets', { token: userToken });
  ok('GET /tickets юзером: только свои билеты', r.status === 200 && r.data.length >= 1 && r.data.every(t => t.userId != null), r);

  r = await req('GET', '/tickets/1', { token: userToken });
  ok('GET чужого билета юзером -> 403', r.status === 403, r);

  r = await req('PUT', '/tickets/6', { token: userToken, body: { owner: 'x', numbers: [1, 2, 3, 4, 5, 6] } });
  ok('PUT чужого билета юзером -> 403', r.status === 403, r);

  r = await req('DELETE', '/tickets/1', { token: userToken });
  ok('DELETE чужого билета юзером -> 403', r.status === 403, r);

  r = await req('GET', '/admin/tickets', { token: userToken });
  ok('Юзер на /admin/tickets -> 403', r.status === 403, r);

  r = await req('GET', '/admin/users', { token: userToken });
  ok('Юзер на /admin/users -> 403', r.status === 403, r);

  r = await req('GET', '/admin/tickets');
  ok('Без токена на /admin/tickets -> 401', r.status === 401, r);

  r = await req('GET', '/admin/tickets', { token: adminToken });
  ok('Админ: все билеты (>=7)', r.status === 200 && r.data.length >= 7, r);
  ok('Админ: у билетов есть владелец (include user)', r.status === 200 && r.data.some(t => t.user && t.user.email === email), r);

  r = await req('GET', '/admin/tickets?status=winner', { token: adminToken });
  ok('Админ: фильтр status=winner', r.status === 200 && r.data.every(t => t.status === 'winner'), r);

  r = await req('GET', '/admin/users', { token: adminToken });
  ok('Админ: список юзеров без passwordHash, есть роли', r.status === 200 && r.data.length >= 4 && r.data.every(u => u.passwordHash === undefined) && r.data.some(u => u.role === 'admin') && r.data.some(u => u.role === 'user'), r);

  r = await req('GET', '/admin/stats', { token: adminToken });
  ok('Админ: статистика', r.status === 200 && typeof r.data.totalTickets === 'number' && r.data.byStatus && typeof r.data.totalPrize === 'number', r);

  r = await req('GET', '/tickets/1', { token: adminToken });
  ok('Админ: GET любого билета -> 200', r.status === 200, r);

  r = await req('GET', '/profile', { token: adminToken });
  ok('Профиль админа: role=admin', r.status === 200 && r.data.role === 'admin', r);

  r = await req('GET', '/profile', { token: userToken });
  ok('Профиль юзера: role=user', r.status === 200 && r.data.role === 'user', r);

  r = await req('DELETE', '/tickets/' + myTicketId, { token: adminToken });
  ok('Админ удаляет чужой билет -> 200', r.status === 200, r);

  r = await req('POST', '/tickets', { token: userToken, body: {} });
  const tid = r.data && r.data.id;
  r = await req('DELETE', '/tickets/' + tid, { token: userToken });
  ok('Юзер удаляет свой билет -> 200', r.status === 200, r);

  console.log('');
  console.log('ИТОГ: PASS=' + passed + ' FAIL=' + failed);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });