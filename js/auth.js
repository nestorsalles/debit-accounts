/* ============================================================
   DebitHub — Authentication Module
   Handles: login, register, forgot password, change password
   ============================================================ */

window.DH = window.DH || {};

DH.auth = (() => {
  const toast = (msg, type) => DH.ui.showToast(msg, type);

  /* ── Validation ── */
  function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function showError(inputId, msg) {
    const el = document.getElementById(inputId + '-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    const inp = document.getElementById(inputId);
    if (inp) inp.style.borderColor = 'var(--danger)';
  }
  function clearError(inputId) {
    const el = document.getElementById(inputId + '-error');
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
    const inp = document.getElementById(inputId);
    if (inp) inp.style.borderColor = '';
  }
  function clearAllErrors() {
    document.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; e.classList.add('hidden'); });
    document.querySelectorAll('.form-input, .form-select').forEach(e => e.style.borderColor = '');
  }

  /* ── Password strength ── */
  function checkPasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  }

  function updateStrengthBar(inputId, barId, textId) {
    const inp = document.getElementById(inputId);
    const bar = document.getElementById(barId);
    const txt = document.getElementById(textId);
    if (!inp || !bar || !txt) return;
    inp.addEventListener('input', () => {
      const score = checkPasswordStrength(inp.value);
      bar.className = 'password-strength-fill strength-' + score;
      const labels = ['', 'password_strength_1', 'password_strength_2', 'password_strength_3', 'password_strength_4'];
      txt.textContent = score > 0 ? DH.i18n.t(labels[score]) : '';
    });
  }

  /* ── Toggle password visibility ── */
  function initPasswordToggles() {
    document.querySelectorAll('[data-password-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-password-toggle');
        const inp = document.getElementById(targetId);
        if (!inp) return;
        if (inp.type === 'password') {
          inp.type = 'text';
          btn.setAttribute('data-icon', 'eye-off');
        } else {
          inp.type = 'password';
          btn.setAttribute('data-icon', 'eye');
        }
        DH.icons.mount(btn);
      });
    });
  }

  /* ════════════════════════════════
     SANFONA (accordion) tabs
  ════════════════════════════════ */
  function initTabs() {
    const headers = document.querySelectorAll('.tab-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const isActive = header.classList.contains('active');
        // Close all
        document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
        document.querySelectorAll('.tab-body').forEach(b => b.classList.remove('open'));
        // Open clicked (if wasn't active)
        if (!isActive) {
          header.classList.add('active');
          const body = header.nextElementSibling;
          if (body && body.classList.contains('tab-body')) {
            body.classList.add('open');
          }
        }
      });
    });
    // Open first tab by default
    if (headers.length > 0) {
      headers[0].classList.add('active');
      const firstBody = headers[0].nextElementSibling;
      if (firstBody) firstBody.classList.add('open');
    }
  }

  /* ════════════════════════════════
     LOGIN
  ════════════════════════════════ */
  function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', handleLogin);
    form.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(e); });
  }

  function handleLogin(e) {
    e.preventDefault();
    clearAllErrors();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    let valid = true;
    if (!email) { showError('login-email', DH.i18n.t('err_required')); valid = false; }
    else if (!validateEmail(email)) { showError('login-email', DH.i18n.t('err_email_invalid')); valid = false; }
    if (!password) { showError('login-password', DH.i18n.t('err_required')); valid = false; }
    if (!valid) return;

    const result = DH.data.users.authenticate(email, password);
    if (result.error) {
      if (result.error === 'err_user_not_found') showError('login-email', DH.i18n.t(result.error));
      else showError('login-password', DH.i18n.t(result.error));
      return;
    }

    DH.data.session.set(result.user);
    toast(DH.i18n.t('toast_login_success'), 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
  }

  /* ════════════════════════════════
     REGISTER
  ════════════════════════════════ */
  function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', handleRegister);
    form.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(e); });

    updateStrengthBar('reg-password', 'reg-strength-bar', 'reg-strength-text');

    // Uppercase security code
    const codeInput = document.getElementById('reg-security-code');
    if (codeInput) {
      codeInput.addEventListener('input', () => {
        const pos = codeInput.selectionStart;
        codeInput.value = codeInput.value.toUpperCase();
        codeInput.setSelectionRange(pos, pos);
      });
    }
  }

  function handleRegister(e) {
    e.preventDefault();
    clearAllErrors();
    const name         = document.getElementById('reg-name').value.trim();
    const email        = document.getElementById('reg-email').value.trim();
    const password     = document.getElementById('reg-password').value;
    const confirmPwd   = document.getElementById('reg-confirm-password').value;
    const securityCode = document.getElementById('reg-security-code').value.trim();

    let valid = true;
    if (!name)         { showError('reg-name', DH.i18n.t('err_required')); valid = false; }
    if (!email)        { showError('reg-email', DH.i18n.t('err_required')); valid = false; }
    else if (!validateEmail(email)) { showError('reg-email', DH.i18n.t('err_email_invalid')); valid = false; }
    if (!password)     { showError('reg-password', DH.i18n.t('err_required')); valid = false; }
    else if (password.length < 6) { showError('reg-password', DH.i18n.t('err_password_min')); valid = false; }
    if (password !== confirmPwd)  { showError('reg-confirm-password', DH.i18n.t('err_passwords_match')); valid = false; }
    if (!securityCode) { showError('reg-security-code', DH.i18n.t('err_required')); valid = false; }
    if (!valid) return;

    const result = DH.data.users.create({ name, email, password, securityCode });
    if (result.error) { showError('reg-email', DH.i18n.t(result.error)); return; }

    DH.data.session.set(result.user);
    toast(DH.i18n.t('toast_register_success'), 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
  }

  /* ════════════════════════════════
     FORGOT PASSWORD MODAL
  ════════════════════════════════ */
  function initForgotPassword() {
    const link    = document.getElementById('forgot-link');
    const overlay = document.getElementById('forgot-modal');
    const closeBtn = document.getElementById('forgot-close');
    const form    = document.getElementById('forgot-form');
    if (!link || !overlay || !form) return;

    link.addEventListener('click', () => openForgotModal());
    if (closeBtn) closeBtn.addEventListener('click', closeForgotModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeForgotModal(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeForgotModal();
    });

    form.addEventListener('submit', handleForgotPassword);
    form.addEventListener('keydown', e => { if (e.key === 'Enter') handleForgotPassword(e); });

    updateStrengthBar('forgot-new-password', 'forgot-strength-bar', 'forgot-strength-text');

    // Uppercase security code
    const codeInput = document.getElementById('forgot-security-code');
    if (codeInput) {
      codeInput.addEventListener('input', () => {
        const pos = codeInput.selectionStart;
        codeInput.value = codeInput.value.toUpperCase();
        codeInput.setSelectionRange(pos, pos);
      });
    }
  }

  function openForgotModal() {
    const overlay = document.getElementById('forgot-modal');
    if (overlay) { overlay.classList.add('open'); clearAllErrors(); }
  }
  function closeForgotModal() {
    const overlay = document.getElementById('forgot-modal');
    if (overlay) { overlay.classList.remove('open'); clearAllErrors(); }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    clearAllErrors();
    const email        = document.getElementById('forgot-email').value.trim();
    const securityCode = document.getElementById('forgot-security-code').value.trim();
    const newPassword  = document.getElementById('forgot-new-password').value;

    let valid = true;
    if (!email)        { showError('forgot-email', DH.i18n.t('err_required')); valid = false; }
    else if (!validateEmail(email)) { showError('forgot-email', DH.i18n.t('err_email_invalid')); valid = false; }
    if (!securityCode) { showError('forgot-security-code', DH.i18n.t('err_required')); valid = false; }
    if (!newPassword)  { showError('forgot-new-password', DH.i18n.t('err_required')); valid = false; }
    else if (newPassword.length < 6) { showError('forgot-new-password', DH.i18n.t('err_password_min')); valid = false; }
    if (!valid) return;

    const result = DH.data.users.resetPassword(email, securityCode, newPassword);
    if (result.error) {
      if (result.error === 'err_user_not_found')   showError('forgot-email', DH.i18n.t(result.error));
      if (result.error === 'err_security_code_wrong') showError('forgot-security-code', DH.i18n.t(result.error));
      return;
    }

    toast(DH.i18n.t('toast_password_reset'), 'success');
    closeForgotModal();
    document.getElementById('forgot-form').reset();
  }

  /* ════════════════════════════════
     CHANGE PASSWORD (dashboard)
  ════════════════════════════════ */
  function initChangePassword() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', handleChangePassword);
    form.addEventListener('keydown', e => { if (e.key === 'Enter') handleChangePassword(e); });

    updateStrengthBar('change-new-password', 'change-strength-bar', 'change-strength-text');
  }

  function handleChangePassword(e) {
    e.preventDefault();
    clearAllErrors();
    const current  = document.getElementById('change-current-password').value;
    const newPwd   = document.getElementById('change-new-password').value;
    const confirm  = document.getElementById('change-confirm-password').value;

    let valid = true;
    if (!current) { showError('change-current-password', DH.i18n.t('err_required')); valid = false; }
    if (!newPwd)  { showError('change-new-password', DH.i18n.t('err_required')); valid = false; }
    else if (newPwd.length < 6) { showError('change-new-password', DH.i18n.t('err_password_min')); valid = false; }
    if (newPwd !== confirm) { showError('change-confirm-password', DH.i18n.t('err_passwords_match')); valid = false; }
    if (!valid) return;

    const userId = DH.state.currentUser?.id;
    const result = DH.data.users.changePassword(userId, current, newPwd);
    if (result.error) { showError('change-current-password', DH.i18n.t(result.error)); return; }

    DH.ui.showToast(DH.i18n.t('toast_password_changed'), 'success');
    form.reset();
    // Close settings panel if open
    DH.ui.closeSectionPanel?.();
  }

  /* ── Init ── */
  function init() {
    initTabs();
    initLoginForm();
    initRegisterForm();
    initForgotPassword();
    initPasswordToggles();
  }

  function initDashboard() {
    initChangePassword();
    initPasswordToggles();
  }

  return {
    init,
    initDashboard,
    openForgotModal,
    closeForgotModal,
  };
})();
