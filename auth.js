const AUTH_KEY = "websuite-session";
const MENU = [
  ["flowboard.html", "📊", "Dashboard"],
  ["siswa.html", "👨‍🎓", "Data Siswa"],
  ["music.html", "🎵", "Music Library"],
  ["statistik.html", "📈", "Statistik"]
];

function getSession() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } }
function isLoggedIn() { const s = getSession(); return !!(s && s.token); }

// Proteksi halaman: tanpa sesi → kembali ke login
if (!isLoggedIn()) location.replace("login.html");

async function logout() {
  try { await fetch("/api/logout", { method: "POST", headers: { Authorization: "Bearer " + (getSession()?.token || "") } }); } catch {}
  localStorage.removeItem(AUTH_KEY);
  location.href = "login.html";
}

function toggleTheme() {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem("websuite-theme", dark ? "dark" : "light");
}

// Sidebar yang sama di semua halaman
function renderSidebar() {
  const el = document.querySelector(".sidebar");
  if (!el) return;
  const page = location.pathname.split("/").pop() || "flowboard.html";
  const link = ([h, i, t]) => `<a ${h === page ? 'class="active" ' : ""}href="${h}"><span>${i}</span><span>${t}</span></a>`;
  const u = getSession()?.username || "Admin";
  el.innerHTML = `
    <div class="brand"><div class="brand-icon">✦</div><div><strong>WebSuite</strong><small>Management System</small></div></div>
    <div class="menu-label">MENU UTAMA</div>
    <nav class="sidebar-menu">${MENU.map(link).join("")}</nav>
    <div class="menu-label">SISTEM</div>
    <nav class="sidebar-menu">${link(["pengaturan.html", "⚙️", "Pengaturan"])}</nav>
    <div class="sidebar-bottom">
      <div class="profile-mini">
        <div class="profile-avatar">${u.charAt(0).toUpperCase()}</div>
        <div class="profile-info"><strong data-user></strong><small data-role></small></div>
      </div>
      <button class="logout-btn" onclick="logout()"><span>🚪</span><span>Logout</span></button>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("websuite-theme") === "dark") document.body.classList.add("dark");
  renderSidebar();
  const s = getSession();
  document.querySelectorAll("[data-user]").forEach(e => e.textContent = s?.username || "Admin");
  document.querySelectorAll("[data-role]").forEach(e => e.textContent = s?.role || "Administrator");
});
