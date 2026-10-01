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
