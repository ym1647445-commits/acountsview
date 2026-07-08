(function () {
  const saved = localStorage.getItem('dp_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.textContent = saved === 'light' ? '☀' : '☾';

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dp_theme', next);
      btn.textContent = next === 'light' ? '☀' : '☾';
    });
  });
})();
