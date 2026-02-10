(function () {
  var apiBase = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE).trim() : 'http://localhost:4000';

  function fetchAccount() {
    return fetch(apiBase + '/api/account', { credentials: 'include' });
  }

  function showView() {
    var unverified = document.getElementById('account-unverified');
    if (unverified) unverified.style.display = 'none';
    document.getElementById('account-view').style.display = 'block';
    document.getElementById('account-edit-form').style.display = 'none';
    document.getElementById('account-password-form').style.display = 'none';
  }

  function showEditForm() {
    document.getElementById('account-view').style.display = 'none';
    document.getElementById('account-edit-form').style.display = 'block';
    document.getElementById('account-password-form').style.display = 'none';
    document.getElementById('edit-message').textContent = '';
    document.getElementById('edit-message').className = 'account-message';
  }

  function showPasswordForm() {
    document.getElementById('account-view').style.display = 'none';
    document.getElementById('account-edit-form').style.display = 'none';
    document.getElementById('account-password-form').style.display = 'block';
    document.getElementById('password-message').textContent = '';
    document.getElementById('password-message').className = 'account-message';
    document.getElementById('pw-current').value = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-confirm').value = '';
  }

  function setMessage(elId, text, isError) {
    var el = document.getElementById(elId);
    el.textContent = text;
    el.className = 'account-message ' + (isError ? 'error' : 'success');
  }

  function showUnverifiedMessage() {
    document.getElementById('account-view').style.display = 'none';
    document.getElementById('account-edit-form').style.display = 'none';
    document.getElementById('account-password-form').style.display = 'none';
    var unverified = document.getElementById('account-unverified');
    if (unverified) {
      unverified.style.display = 'block';
    }
  }

  function loadAccount() {
    fetchAccount()
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = 'index.html';
          return { _status: 401 };
        }
        if (res.status === 403) {
          return res.json().then(function (data) {
            return { _status: 403, code: data && data.code, error: data && data.error };
          });
        }
        return res.json().then(function (data) { return { _status: 200, data: data }; });
      })
      .then(function (result) {
        if (!result || result._status === 401) return;
        if (result._status === 403 && result.code === 'EMAIL_NOT_VERIFIED') {
          showUnverifiedMessage();
          return;
        }
        if (result._status !== 200 || !result.data) {
          window.location.href = 'index.html';
          return;
        }
        var data = result.data;
        document.getElementById('disp-username').textContent = data.username || '—';
        document.getElementById('disp-email').textContent = data.email || '—';
        document.getElementById('disp-phone').textContent = data.phone || '—';
        document.getElementById('edit-username').value = data.username || '';
        document.getElementById('edit-email').value = data.email || '';
        document.getElementById('edit-phone').value = data.phone || '';

        var adminBtns = document.getElementById('account-admin-buttons');
        if (adminBtns && data.role === 'ADMIN') {
          adminBtns.style.display = 'flex';
        }
        var unverified = document.getElementById('account-unverified');
        if (unverified) unverified.style.display = 'none';
      })
      .catch(function () {
        window.location.href = 'index.html';
      });
  }

  function saveEdit() {
    var username = document.getElementById('edit-username').value.trim();
    var email = document.getElementById('edit-email').value.trim();
    var phone = document.getElementById('edit-phone').value.trim();
    var msgEl = document.getElementById('edit-message');

    fetch(apiBase + '/api/account', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, email: email, phone: phone })
    })
      .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
      .then(function (r) {
        if (r.status === 200 && r.data.username) {
          document.getElementById('disp-username').textContent = r.data.username;
          document.getElementById('disp-email').textContent = r.data.email;
          document.getElementById('disp-phone').textContent = r.data.phone;
          setMessage('edit-message', 'Information updated.', false);
          showView();
        } else {
          setMessage('edit-message', (r.data && r.data.error) ? r.data.error : 'Update failed', true);
        }
      })
      .catch(function () {
        setMessage('edit-message', 'Network error', true);
      });
  }

  function savePassword() {
    var current = document.getElementById('pw-current').value;
    var newPw = document.getElementById('pw-new').value;
    var confirmPw = document.getElementById('pw-confirm').value;
    if (newPw !== confirmPw) {
      setMessage('password-message', 'New password and confirm do not match.', true);
      return;
    }

    fetch(apiBase + '/api/account/change-password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    })
      .then(function (res) { return res.json().then(function (data) { return { status: res.status, data: data }; }); })
      .then(function (r) {
        if (r.status === 200 && r.data && r.data.ok) {
          setMessage('password-message', 'Password changed.', false);
          document.getElementById('pw-current').value = '';
          document.getElementById('pw-new').value = '';
          document.getElementById('pw-confirm').value = '';
          setTimeout(function () { showView(); }, 800);
        } else {
          setMessage('password-message', (r.data && r.data.error) ? r.data.error : 'Failed to change password', true);
        }
      })
      .catch(function () {
        setMessage('password-message', 'Network error', true);
      });
  }

  function init() {
    loadAccount();

    var resendBtn = document.getElementById('account-resend-verify');
    if (resendBtn) {
      resendBtn.addEventListener('click', function () {
        resendBtn.disabled = true;
        fetch(apiBase + '/api/auth/resend-verification', { method: 'POST', credentials: 'include' })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            alert(data.message || 'Verification email sent.');
            resendBtn.disabled = false;
          })
          .catch(function () {
            alert('Failed to send.');
            resendBtn.disabled = false;
          });
      });
    }

    document.getElementById('btn-edit-info').addEventListener('click', showEditForm);
    document.getElementById('btn-cancel-edit').addEventListener('click', showView);
    document.getElementById('btn-save-edit').addEventListener('click', saveEdit);

    document.getElementById('btn-change-password').addEventListener('click', showPasswordForm);
    document.getElementById('btn-cancel-password').addEventListener('click', showView);
    document.getElementById('btn-save-password').addEventListener('click', savePassword);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
