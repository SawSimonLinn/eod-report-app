(function () {
  var THEME_KEY = 'eodTheme';
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  btn.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    apply(next);
  });
})();
