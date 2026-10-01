if (JSON.parse(localStorage.getItem('websuite-session') || 'null')?.token) location.href = 'flowboard.html';

function togglePassword() {
  const i = document.getElementById('password');
  i.type = i.type === 'password' ? 'text' : 'password';
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('error');
  try {
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('username').value.trim(), password: document.getElementById('password').value })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    localStorage.setItem('websuite-session', JSON.stringify({ username: d.username, role: d.role, token: d.token }));
    document.getElementById('loginButton').textContent = 'Berhasil masuk...';
    setTimeout(() => location.href = 'flowboard.html', 400);
  } catch (x) {
    err.textContent = x.message === 'Failed to fetch' ? 'Terjadi kesalahan. Muat ulang halaman.' : x.message;
    err.classList.add('show');
  }
});
document.getElementById('year').textContent = new Date().getFullYear();

function showMode(reg) {
  document.getElementById('loginForm').hidden = reg;
  document.getElementById('registerForm').hidden = !reg;
  document.getElementById('title').textContent = reg ? 'Buat akun baru' : 'Welcome back 👋';
  document.getElementById('sub').textContent = reg ? 'Isi data di bawah untuk mendaftar.' : 'Masuk untuk mengakses dashboard.';
  document.getElementById('error').classList.remove('show');
}
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('error'), pw = document.getElementById('rPass').value;
  try {
    if (pw !== document.getElementById('rPass2').value) throw new Error('Password dan ulangi password tidak sama.');
    const r = await fetch('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: document.getElementById('rUser').value.trim(), password: pw })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    localStorage.setItem('websuite-session', JSON.stringify({ username: d.username, role: d.role, token: d.token }));
    document.getElementById('registerButton').textContent = 'Akun dibuat, masuk...';
    setTimeout(() => location.href = 'flowboard.html', 400);
  } catch (x) {
    err.textContent = x.message;
    err.classList.add('show');
  }
});
