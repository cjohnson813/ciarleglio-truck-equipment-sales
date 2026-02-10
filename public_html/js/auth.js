(function () {
  var apiBase = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE).trim() : 'http://localhost:4000';

  function getAuthLink() {
    return document.getElementById('auth-link');
  }

  function setLoggedIn(username) {
    var link = getAuthLink();
    if (!link) return;
    link.textContent = username;
    link.href = 'account.html';
    link.removeAttribute('aria-describedby');
  }

  function setLoggedOut() {
    var link = getAuthLink();
    if (!link) return;
    link.textContent = 'Login/Sign Up';
    link.href = '#';
  }

  function checkSession() {
    fetch(apiBase + '/api/auth/me', { credentials: 'include' })
      .then(function (res) {
        if (res.ok) return res.json();
        setLoggedOut();
        return null;
      })
      .then(function (data) {
        if (data && data.user && data.user.username) setLoggedIn(data.user.username);
      })
      .catch(function () { setLoggedOut(); });
  }

  function openModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.getElementById('auth-login-error').textContent = '';
      document.getElementById('auth-signup-error').textContent = '';
    }
  }

  function closeModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function switchTab(tabName) {
    var loginForm = document.getElementById('auth-login-form');
    var signupForm = document.getElementById('auth-signup-form');
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });
    if (tabName === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
    }
  }

  function initModal() {
    var modal = document.getElementById('auth-modal');
    var link = getAuthLink();
    var closeBtn = document.getElementById('auth-modal-close');
    var backdrop = modal && modal.querySelector('.auth-modal-backdrop');

    if (link) {
      link.addEventListener('click', function (e) {
        if (this.getAttribute('href') === '#' || this.href.endsWith('#')) {
          e.preventDefault();
          openModal();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.querySelectorAll('.auth-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(this.getAttribute('data-tab'));
      });
    });

    var loginForm = document.getElementById('auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var errEl = document.getElementById('auth-login-error');
        errEl.textContent = '';
        var fd = new FormData(loginForm);
        var login = fd.get('login');
        var password = fd.get('password');
        fetch(apiBase + '/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: login, password: password })
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (r.ok && r.data.user) {
              setLoggedIn(r.data.user.username);
              closeModal();
              loginForm.reset();
            } else {
              errEl.textContent = (r.data && r.data.error) ? r.data.error : 'Login failed';
            }
          })
          .catch(function () {
            errEl.textContent = 'Network error';
          });
      });
    }

    var signupForm = document.getElementById('auth-signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var errEl = document.getElementById('auth-signup-error');
        errEl.textContent = '';
        var fd = new FormData(signupForm);
        var username = fd.get('username');
        var email = fd.get('email');
        var phone = fd.get('phone');
        var password = fd.get('password');
        if (!username || !email || !phone || !password) {
          errEl.textContent = 'All fields required';
          return;
        }
        fetch(apiBase + '/api/auth/signup', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: String(username).trim(), email: String(email).trim(), phone: String(phone).trim(), password: String(password) })
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, status: res.status, data: data }; }); })
          .then(function (r) {
            if (r.ok && r.data.user) {
              setLoggedIn(r.data.user.username);
              closeModal();
              signupForm.reset();
            } else {
              errEl.textContent = (r.data && r.data.error) ? r.data.error : 'Sign up failed';
            }
          })
          .catch(function () {
            errEl.textContent = 'Network error';
          });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      checkSession();
      initModal();
    });
  } else {
    checkSession();
    initModal();
  }
})();
