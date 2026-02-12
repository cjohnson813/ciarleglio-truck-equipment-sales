/**
 * Global Contact Us modal: open from any [data-contact-open] button.
 * Autofills name/phone/email from /api/account when logged in; allows override.
 * ESC / outside click closes; focus trap; loading state; success/error feedback.
 */
(function () {
  var apiBase = (typeof window !== 'undefined' && window.API_BASE ? String(window.API_BASE).trim() : '') || 'http://localhost:4000';
  var modal = null;
  var form = null;
  var submitBtn = null;
  var statusEl = null;
  var focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function getModal() {
    return document.getElementById('contact-modal');
  }

  function openModal() {
    modal = getModal();
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    maybeAutofill();
    var firstFocus = modal.querySelector(focusableSelector);
    if (firstFocus) firstFocus.focus();
  }

  function closeModal() {
    modal = getModal();
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function maybeAutofill() {
    fetch(apiBase + '/api/account', { credentials: 'include' })
      .then(function (res) {
        if (!res.ok) return;
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        var nameEl = document.getElementById('contact-name');
        var phoneEl = document.getElementById('contact-phone');
        var emailEl = document.getElementById('contact-email');
        if (nameEl && data.username) nameEl.value = data.username;
        if (phoneEl && data.phone) phoneEl.value = data.phone;
        if (emailEl && data.email) emailEl.value = data.email;
      })
      .catch(function () {});
  }

  function trapFocus(e) {
    if (!modal || !modal.classList.contains('is-open')) return;
    var focusable = modal.querySelectorAll(focusableSelector);
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function init() {
    modal = getModal();
    if (!modal) return;
    form = document.getElementById('contact-form');
    submitBtn = document.getElementById('contact-submit');
    statusEl = document.getElementById('contact-status');

    document.querySelectorAll('[data-contact-open]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    var backdrop = modal.querySelector('.contact-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);

    var closeBtn = document.getElementById('contact-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      trapFocus(e);
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (submitBtn && submitBtn.disabled) return;
        var name = (document.getElementById('contact-name') && document.getElementById('contact-name').value) || '';
        var phone = (document.getElementById('contact-phone') && document.getElementById('contact-phone').value) || '';
        var email = (document.getElementById('contact-email') && document.getElementById('contact-email').value) || '';
        var business = (document.getElementById('contact-business') && document.getElementById('contact-business').value) || '';
        var message = (document.getElementById('contact-message') && document.getElementById('contact-message').value) || '';
        if (statusEl) statusEl.textContent = '';
        if (statusEl) statusEl.className = 'contact-status';
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtn) submitBtn.textContent = 'Sending...';
        fetch(apiBase + '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), business: business.trim() || undefined, message: message.trim() }),
          credentials: 'include'
        })
          .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
          .then(function (result) {
            if (result.ok) {
              if (statusEl) { statusEl.textContent = result.body.message || 'Message sent. We\'ll get back to you soon.'; statusEl.className = 'contact-status contact-status-success'; }
              form.reset();
            } else {
              if (statusEl) { statusEl.textContent = result.body.error || 'Something went wrong.'; statusEl.className = 'contact-status contact-status-error'; }
            }
          })
          .catch(function () {
            if (statusEl) { statusEl.textContent = 'Failed to send. Please try again.'; statusEl.className = 'contact-status contact-status-error'; }
          })
          .finally(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send message'; }
          });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
