const $ = id => document.getElementById(id);
API.json('/stats').then(s => {
  const t = s.total || 1, p = v => Math.round((v || 0) / t * 100);
  $('students').textContent = s.total;
  $('average').textContent = s.rata.toFixed(1);
  $('favorites').textContent = s.favorites;
  $('activeStudent').textContent = s.aktif + ' siswa';
  $('inactiveStudent').textContent = s.nonaktif + ' siswa';
  [['excellent', 'barExcellent', s.excellent], ['good', 'barGood', s.good], ['medium', 'barMedium', s.medium]]
    .forEach(([a, b, v]) => { $(a).textContent = p(v) + '%'; $(b).style.width = p(v) + '%'; });
});
