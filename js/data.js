/* ============================================================
   DebitHub — Data Layer (localStorage CRUD)
   ============================================================ */

window.DH = window.DH || {};

DH.state = {
  currentUser: null,
  language: 'pt',
  currency: 'BRL',
  theme: 'dark',
};

DH.data = (() => {
  const KEYS = {
    users:      'dh_users',
    credores:   'dh_credores',
    debitos:    'dh_debitos',
    pagamentos: 'dh_pagamentos',
    session:    'dh_session',
    settings:   'dh_settings',
    language:   'dh_language',
    theme:      'dh_theme',
    currency:   'dh_currency',
  };

  /* ── UUID generator ── */
  function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  /* ── Slug generator ── */
  function toSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /* ── Simple password encoding (NOT production-grade hashing) ── */
  function encodePassword(pwd) {
    return btoa(unescape(encodeURIComponent(pwd + ':dh_salt_2024')));
  }
  function verifyPassword(pwd, encoded) {
    return encodePassword(pwd) === encoded;
  }

  /* ── Storage helpers ── */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function loadOne(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }
  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /* ══════════════════════════════
     USERS
  ══════════════════════════════ */
  const users = {
    getAll() { return load(KEYS.users); },
    getById(id) { return this.getAll().find(u => u.id === id) || null; },
    getByEmail(email) { return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; },

    create({ name, email, password, securityCode }) {
      const all = this.getAll();
      if (this.getByEmail(email)) return { error: 'err_email_taken' };
      const user = {
        id: uuid(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: encodePassword(password),
        securityCode: securityCode.trim().toUpperCase(),
        createdAt: new Date().toISOString(),
      };
      all.push(user);
      save(KEYS.users, all);
      return { user };
    },

    authenticate(email, password) {
      const user = this.getByEmail(email);
      if (!user) return { error: 'err_user_not_found' };
      if (!verifyPassword(password, user.password)) return { error: 'err_wrong_password' };
      return { user };
    },

    resetPassword(email, securityCode, newPassword) {
      const all = this.getAll();
      const idx = all.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx < 0) return { error: 'err_user_not_found' };
      if (all[idx].securityCode !== securityCode.trim().toUpperCase()) return { error: 'err_security_code_wrong' };
      all[idx].password = encodePassword(newPassword);
      save(KEYS.users, all);
      return { success: true };
    },

    changePassword(userId, currentPassword, newPassword) {
      const all = this.getAll();
      const idx = all.findIndex(u => u.id === userId);
      if (idx < 0) return { error: 'err_user_not_found' };
      if (!verifyPassword(currentPassword, all[idx].password)) return { error: 'err_wrong_password' };
      all[idx].password = encodePassword(newPassword);
      save(KEYS.users, all);
      return { success: true };
    },

    updateName(userId, name) {
      const all = this.getAll();
      const idx = all.findIndex(u => u.id === userId);
      if (idx < 0) return { error: 'err_user_not_found' };
      all[idx].name = name.trim();
      save(KEYS.users, all);
      // Update session
      if (DH.state.currentUser && DH.state.currentUser.id === userId) {
        DH.state.currentUser.name = name.trim();
        save(KEYS.session, DH.state.currentUser);
      }
      return { user: all[idx] };
    },
  };

  /* ══════════════════════════════
     SESSION
  ══════════════════════════════ */
  const session = {
    get() { return loadOne(KEYS.session); },
    set(user) { save(KEYS.session, user); DH.state.currentUser = user; },
    clear() { localStorage.removeItem(KEYS.session); DH.state.currentUser = null; },
  };

  /* ══════════════════════════════
     CREDORES
  ══════════════════════════════ */
  const credores = {
    getAll(userId) {
      return load(KEYS.credores).filter(c => c.userId === userId);
    },
    getAllPublic() {
      return load(KEYS.credores);
    },
    getById(id) {
      return load(KEYS.credores).find(c => c.id === id) || null;
    },
    getBySlug(slug) {
      return load(KEYS.credores).find(c => c.slug === slug) || null;
    },

    create(userId, { name, city, state, phone }) {
      const all = load(KEYS.credores);
      const baseSlug = toSlug(name);
      // Ensure unique slug
      let slug = baseSlug;
      let count = 1;
      while (all.some(c => c.slug === slug)) { slug = baseSlug + '-' + count++; }

      const credor = {
        id: uuid(), userId,
        name: name.trim(), slug, city: city.trim(), state: state.trim().toUpperCase(), phone: phone.trim(),
        createdAt: new Date().toISOString(),
      };
      all.push(credor);
      save(KEYS.credores, all);
      return credor;
    },

    update(id, { name, city, state, phone }) {
      const all = load(KEYS.credores);
      const idx = all.findIndex(c => c.id === id);
      if (idx < 0) return null;
      const baseSlug = toSlug(name);
      let slug = baseSlug;
      let count = 1;
      while (all.some(c => c.slug === slug && c.id !== id)) { slug = baseSlug + '-' + count++; }
      all[idx] = { ...all[idx], name: name.trim(), slug, city: city.trim(), state: state.trim().toUpperCase(), phone: phone.trim() };
      save(KEYS.credores, all);
      return all[idx];
    },

    delete(id) {
      const allC = load(KEYS.credores).filter(c => c.id !== id);
      const allD = load(KEYS.debitos).filter(d => d.creditorId !== id);
      const allP = load(KEYS.pagamentos).filter(p => p.creditorId !== id);
      save(KEYS.credores, allC);
      save(KEYS.debitos, allD);
      save(KEYS.pagamentos, allP);
    },
  };

  /* ══════════════════════════════
     DEBITOS
  ══════════════════════════════ */
  const debitos = {
    getAll(userId) {
      return load(KEYS.debitos).filter(d => d.userId === userId);
    },
    getAllPublic() { return load(KEYS.debitos); },
    getById(id) { return load(KEYS.debitos).find(d => d.id === id) || null; },
    getByCreditor(creditorId, userId) {
      return load(KEYS.debitos).filter(d => d.creditorId === creditorId && (userId ? d.userId === userId : true));
    },

    create(userId, { creditorId, description, date, amount, type, installments }) {
      const all = load(KEYS.debitos);
      amount = parseFloat(amount);
      installments = parseInt(installments) || 1;
      const installmentAmount = type === 'installment' ? +(amount / installments).toFixed(2) : amount;

      const debit = {
        id: uuid(), userId, creditorId,
        description: description.trim(),
        date,
        amount,
        type, // 'unique' | 'installment' | 'recurring'
        installments: type === 'installment' ? installments : (type === 'recurring' ? 0 : 1),
        installmentAmount,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      all.push(debit);
      save(KEYS.debitos, all);
      return debit;
    },

    update(id, fields) {
      const all = load(KEYS.debitos);
      const idx = all.findIndex(d => d.id === id);
      if (idx < 0) return null;
      const amount = parseFloat(fields.amount);
      const installments = parseInt(fields.installments) || 1;
      const installmentAmount = fields.type === 'installment' ? +(amount / installments).toFixed(2) : amount;
      all[idx] = {
        ...all[idx],
        description: fields.description.trim(),
        date: fields.date,
        amount,
        type: fields.type,
        installments: fields.type === 'installment' ? installments : (fields.type === 'recurring' ? 0 : 1),
        installmentAmount,
      };
      // Recompute status
      all[idx].status = debitos._computeStatus(all[idx]);
      save(KEYS.debitos, all);
      return all[idx];
    },

    delete(id) {
      const allD = load(KEYS.debitos).filter(d => d.id !== id);
      const allP = load(KEYS.pagamentos).filter(p => p.debitId !== id);
      save(KEYS.debitos, allD);
      save(KEYS.pagamentos, allP);
    },

    // Recalculate status based on payments
    updateStatus(debitId) {
      const all = load(KEYS.debitos);
      const idx = all.findIndex(d => d.id === debitId);
      if (idx < 0) return;
      const debit = all[idx];
      const payments = load(KEYS.pagamentos).filter(p => p.debitId === debitId);
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      if (totalPaid <= 0) { all[idx].status = 'active'; }
      else if (totalPaid >= debit.amount) { all[idx].status = 'paid'; }
      else { all[idx].status = 'partial'; }
      save(KEYS.debitos, all);
      return all[idx];
    },

    _computeStatus(debit) {
      const payments = load(KEYS.pagamentos).filter(p => p.debitId === debit.id);
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      if (totalPaid <= 0) return 'active';
      if (totalPaid >= debit.amount) return 'paid';
      return 'partial';
    },
  };

  /* ══════════════════════════════
     PAGAMENTOS
  ══════════════════════════════ */
  const pagamentos = {
    getAll(userId) {
      return load(KEYS.pagamentos).filter(p => p.userId === userId);
    },
    getAllPublic() { return load(KEYS.pagamentos); },
    getByCreditor(creditorId) {
      return load(KEYS.pagamentos).filter(p => p.creditorId === creditorId);
    },
    getByDebit(debitId) {
      return load(KEYS.pagamentos).filter(p => p.debitId === debitId);
    },

    create(userId, { creditorId, debitId, amount, date, note }) {
      const all = load(KEYS.pagamentos);
      amount = parseFloat(amount);
      const pag = {
        id: uuid(), userId, creditorId, debitId,
        amount, date,
        note: (note || '').trim(),
        createdAt: new Date().toISOString(),
      };
      all.push(pag);
      save(KEYS.pagamentos, all);
      // Update debit status
      debitos.updateStatus(debitId);
      return pag;
    },

    delete(id) {
      const all = load(KEYS.pagamentos);
      const pag = all.find(p => p.id === id);
      const filtered = all.filter(p => p.id !== id);
      save(KEYS.pagamentos, filtered);
      if (pag) debitos.updateStatus(pag.debitId);
    },

    /* Total paid for a specific debit */
    totalPaidForDebit(debitId) {
      return load(KEYS.pagamentos)
        .filter(p => p.debitId === debitId)
        .reduce((s, p) => s + p.amount, 0);
    },

    /* Total paid for a creditor */
    totalPaidForCreditor(creditorId) {
      return load(KEYS.pagamentos)
        .filter(p => p.creditorId === creditorId)
        .reduce((s, p) => s + p.amount, 0);
    },
  };

  /* ══════════════════════════════
     ANALYTICS / SUMMARY
  ══════════════════════════════ */
  const analytics = {
    /* Returns summary within a date range [from, to] (Date objects) */
    summary(userId, from, to) {
      const ds = debitos.getAll(userId);
      const ps = pagamentos.getAll(userId);

      const inRange = (d) => {
        if (!from && !to) return true;
        const dt = new Date(d);
        if (from && dt < from) return false;
        if (to   && dt > to)   return false;
        return true;
      };

      const filteredDebits   = ds.filter(d => inRange(d.date));
      const filteredPayments = ps.filter(p => inRange(p.date));

      const totalDebt  = filteredDebits.reduce((s, d) => s + d.amount, 0);
      const totalPaid  = filteredPayments.reduce((s, p) => s + p.amount, 0);
      const activeDebt = filteredDebits.filter(d => d.status !== 'paid').reduce((s, d) => s + d.amount, 0);
      const paidDebt   = filteredDebits.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0);

      // This month
      const now = new Date();
      const thisMonthDebits = ds.filter(d => {
        const dt = new Date(d.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });
      const thisMonthAmount = thisMonthDebits.reduce((s, d) => s + d.amount, 0);

      // Creditors with debts
      const creditorIds = [...new Set(filteredDebits.map(d => d.creditorId))];

      return {
        totalDebt,
        totalPaid,
        activeDebt,
        paidDebt,
        thisMonth: thisMonthAmount,
        creditorCount: creditorIds.length,
        debitCount: filteredDebits.length,
        paymentCount: filteredPayments.length,
      };
    },

    /* Per-creditor summary */
    creditorSummary(creditorId) {
      const ds = load('dh_debitos').filter(d => d.creditorId === creditorId);
      const ps = load('dh_pagamentos').filter(p => p.creditorId === creditorId);

      const totalDebt  = ds.reduce((s, d) => s + d.amount, 0);
      const totalPaid  = ps.reduce((s, p) => s + p.amount, 0);
      const balance    = Math.max(0, totalDebt - totalPaid);

      const now = new Date();
      const thisMonthDebits = ds.filter(d => {
        const dt = new Date(d.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });
      const thisMonthPaid = ps.filter(p => {
        const dt = new Date(p.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });

      return {
        totalDebt, totalPaid, balance,
        thisMonthDebt: thisMonthDebits.reduce((s, d) => s + d.amount, 0),
        thisMonthPaid: thisMonthPaid.reduce((s, p) => s + p.amount, 0),
        activeDebits:  ds.filter(d => d.status === 'active' || d.status === 'partial'),
        paidDebits:    ds.filter(d => d.status === 'paid'),
        debitCount:    ds.length,
        paymentCount:  ps.length,
      };
    },
  };

  /* ── Settings helpers ── */
  const settings = {
    get() {
      return {
        theme:    localStorage.getItem('dh_theme')    || 'dark',
        language: localStorage.getItem('dh_language') || 'pt',
        currency: localStorage.getItem('dh_currency') || 'BRL',
      };
    },
    setTheme(t)    { localStorage.setItem('dh_theme', t);    DH.state.theme = t; },
    setLanguage(l) { localStorage.setItem('dh_language', l); DH.state.language = l; },
    setCurrency(c) { localStorage.setItem('dh_currency', c); DH.state.currency = c; },
  };

  /* ── Public API ── */
  return { uuid, toSlug, users, session, credores, debitos, pagamentos, analytics, settings };
})();

/* ══════════════════════════════════════════
   Currency formatting
══════════════════════════════════════════ */
DH.currency = (() => {
  const configs = {
    BRL: { locale: 'pt-BR', currency: 'BRL' },
    EUR: { locale: 'de-DE', currency: 'EUR' },
    USD: { locale: 'en-US', currency: 'USD' },
    GBP: { locale: 'en-GB', currency: 'GBP' },
  };

  function format(amount) {
    const code = DH.state.currency || 'BRL';
    const cfg  = configs[code] || configs.BRL;
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency', currency: cfg.currency, minimumFractionDigits: 2,
    }).format(amount || 0);
  }

  function setCurrency(code) {
    DH.state.currency = code;
    DH.data.settings.setCurrency(code);
  }

  return { format, setCurrency };
})();

/* ══════════════════════════════════════════
   Date utilities
══════════════════════════════════════════ */
DH.dates = (() => {
  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString + (isoString.includes('T') ? '' : 'T00:00:00'));
    const lang = DH.state.language || 'pt';
    if (lang === 'pt') {
      return d.toLocaleDateString('pt-BR');
    }
    return d.toLocaleDateString('en-US');
  }

  function formatMonthYear(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString + (isoString.includes('T') ? '' : 'T00:00:00'));
    const lang = DH.state.language || 'pt';
    const months = DH.i18n.t('month_names');
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function rangeFromFilter(filter) {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let from;
    switch (filter) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3m':
        from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        from = null;
    }
    return { from, to };
  }

  return { formatDate, formatMonthYear, today, rangeFromFilter };
})();
