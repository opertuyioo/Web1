const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let students = [];

async function load() { students = await API.json('/siswa'); render(); }

function render() {
  const q = $('search').value.toLowerCase(), k = $('filterKelas').value;
  const data = students.filter(s => (s.nama + ' ' + s.nis + ' ' + s.email).toLowerCase().includes(q) && (!k || s.kelas === k));
  $('table').innerHTML = data.length ? data.map(s => `<tr>
    <td><div class="student-cell"><div class="avatar">${esc(s.nama[0])}</div><strong>${esc(s.nama)}</strong></div></td>
    <td>${esc(s.nis)}</td><td>${esc(s.kelas)}</td><td>${esc(s.email)}</td><td><strong>${s.nilai}</strong></td>
    <td><span class="badge ${s.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">${s.status}</span></td>
    <td><button class="icon-btn" onclick="openModal(${s.id})">✏️</button>
        <button class="icon-btn" onclick="deleteStudent(${s.id})">🗑️</button></td></tr>`).join('')
    : `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">Data tidak ditemukan.</td></tr>`;
  $('total').textContent = students.length;
  $('aktif').textContent = students.filter(s => s.status === 'Aktif').length;
  $('kelas').textContent = new Set(students.map(s => s.kelas)).size;
  $('rata').textContent = (students.length ? students.reduce((a, s) => a + s.nilai, 0) / students.length : 0).toFixed(1);
}

function openModal(id) {
  $('modal').classList.add('show'); $('studentForm').reset(); $('editId').value = '';
  const s = id && students.find(x => x.id === id);
  $('modalTitle').textContent = s ? 'Edit Siswa' : 'Tambah Siswa';
  if (s) {
    $('editId').value = s.id; $('nama').value = s.nama; $('nis').value = s.nis; $('kelasInput').value = s.kelas;
    $('email').value = s.email; $('nilai').value = s.nilai; $('status').value = s.status;
  }
}
function closeModal() { $('modal').classList.remove('show'); }

async function deleteStudent(id) {
  const s = students.find(x => x.id === id);
  if (!confirm(`Hapus data ${s.nama}?`)) return;
  try { await API.req('/siswa/' + id, { method: 'DELETE' }); load(); } catch (e) { alert(e.message); }
}

$('studentForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('editId').value;
  const d = { nama: $('nama').value, nis: $('nis').value, kelas: $('kelasInput').value,
    email: $('email').value, nilai: Number($('nilai').value), status: $('status').value };
  try {
    await API.json('/siswa' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', json: d });
    closeModal(); load();
  } catch (err) { alert(err.message); }
});

function exportExcel() { API.download('/siswa/export', 'data-siswa.xlsx'); }
const exportCSV = exportExcel; // kompatibel dengan tombol lama

async function importExcel(el) {
  const f = el.files[0]; if (!f) return;
  try {
    const r = await API.json('/siswa/import', { method: 'POST', body: await f.arrayBuffer() });
    alert(r.imported + ' data siswa berhasil diimpor.'); load();
  } catch (e) { alert(e.message); }
  el.value = '';
}
async function openExcel() {
  try { await API.req('/siswa/open-excel', { method: 'POST' }); } catch (e) { alert(e.message); }
}
// refresh otomatis agar perubahan dari Excel langsung tampil
setInterval(() => { if (!$('modal').classList.contains('show')) load().catch(() => {}); }, 3000);
load();
