(function () {
  var apiBase = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE).trim() : 'http://localhost:4000';

  function setMessage(text, isError) {
    var el = document.getElementById('admin-users-message');
    if (el) {
      el.textContent = text;
      el.className = 'admin-users-message' + (isError ? ' error' : '');
    }
  }

  function loadUsers() {
    fetch(apiBase + '/api/admin/users', { credentials: 'include' })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) {
          setMessage('You must be logged in as an admin to view this page.', true);
          return null;
        }
        return res.json();
      })
      .then(function (users) {
        if (!users || !Array.isArray(users)) return;
        setMessage('');
        var tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        users.forEach(function (u) {
          var tr = document.createElement('tr');
          var verifiedClass = u.emailVerifiedAt ? 'verified' : 'unverified';
          var verifiedText = u.emailVerifiedAt ? 'Yes' : 'No';
          var select = document.createElement('select');
          select.dataset.userId = u.id;
          select.innerHTML = '<option value="USER"' + (u.role === 'USER' ? ' selected' : '') + '>User</option><option value="ADMIN"' + (u.role === 'ADMIN' ? ' selected' : '') + '>Admin</option>';
          select.addEventListener('change', function () {
            var newRole = this.value;
            if (newRole === u.role) return;
            fetch(apiBase + '/api/admin/users/' + u.id, {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: newRole })
            })
              .then(function (r) {
                if (r.ok) {
                  u.role = newRole;
                  setMessage('Role updated.');
                } else {
                  return r.json().then(function (d) {
                    setMessage((d && d.error) ? d.error : 'Update failed', true);
                    select.value = u.role;
                  });
                }
              })
              .catch(function () {
                setMessage('Network error', true);
                select.value = u.role;
              });
          });
          tr.innerHTML = '<td>' + (u.username || '') + '</td><td>' + (u.email || '') + '</td><td>' + (u.phone || '') + '</td><td class="' + verifiedClass + '">' + verifiedText + '</td><td></td>';
          tr.querySelector('td:last-child').appendChild(select);
          tbody.appendChild(tr);
        });
      })
      .catch(function () {
        setMessage('Failed to load users.', true);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUsers);
  } else {
    loadUsers();
  }
})();
