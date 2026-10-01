const $ = id => document.getElementById(id);
$('darkToggle').checked = localStorage.getItem('websuite-theme') === 'dark';

function changeTheme(el) {
  document.body.classList.toggle('dark', el.checked);
  localStorage.setItem('websuite-theme', el.checked ? 'dark' : 'light');
}
async function resetStudents() {
  if (!confirm('Hapus semua data siswa di database?')) return;
  try { await API.req('/siswa', { method: 'DELETE' }); alert('Data siswa berhasil direset.'); } catch (e) { alert(e.message); }
}
async function resetFavorites() {
  if (!confirm('Hapus semua favorit musik?')) return;
  try { await API.req('/favorites', { method: 'DELETE' }); alert('Favorit musik berhasil direset.'); } catch (e) { alert(e.message); }
}
