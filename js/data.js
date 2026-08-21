/* ============================================================
   DebitHub — Data Layer (localStorage CRUD)
   ============================================================ */

window.DH = window.DH || {};

DH.state = {
  currentUser: null,
  language: 'pt',
  theme: 'dark',
};

DH.data = (() => {
  const KEYS = {
    users:      'dh_users',
    credores:   'dh_credores',
    debitos:    'dh_debitos',
    pagamentos: 'dh_pagamentos',
    billing:    'dh_billing',
    plans:      'dh_plans',
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

  /* ── CPF validation (real check-digit algorithm) ── */
  function isValidCPF(raw) {
    const cpf = String(raw || '').replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // all same digit
    const calc = (len) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += parseInt(cpf[i], 10) * (len + 1 - i);
      const r = (sum * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === parseInt(cpf[9], 10) && calc(10) === parseInt(cpf[10], 10);
  }
  function formatCPF(raw) {
    const cpf = String(raw || '').replace(/\D/g, '').padEnd(11, ' ').slice(0, 11);
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4').trim();
  }

  /* ── Simple password encoding (NOT production-grade hashing) ── */
  function encodePassword(pwd) {
    return btoa(unescape(encodeURIComponent(pwd + ':dh_salt_2024')));
  }
  function verifyPassword(pwd, encoded) {
    return encodePassword(pwd) === encoded;
  }

  /* ── Self-contained share-link encoding (URL-safe base64 of JSON) ── */
  const share = {
    encode(obj) {
      const json = JSON.stringify(obj);
      return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    decode(str) {
      try {
        let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const json = decodeURIComponent(escape(atob(b64)));
        return JSON.parse(json);
      } catch { return null; }
    },
  };

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

    create({ name, email, password, securityCode, phone, cpf, country, city, state, planId, paymentMethod, currency, role }) {
      const all = this.getAll();
      if (this.getByEmail(email)) return { error: 'err_email_taken' };
      const isBR = (country || 'BR') === 'BR';
      if (role !== 'admin') {
        if (!phone || !phone.trim()) return { error: 'err_required_phone' };
        if (isBR) { if (!isValidCPF(cpf)) return { error: 'err_cpf_invalid' }; }
        else { if (!cpf || !String(cpf).trim()) return { error: 'err_required_document' }; }
        if (!city || !city.trim()) return { error: 'err_required_city' };
        if (!state || !state.trim()) return { error: 'err_required_state' };
        if (!planId) return { error: 'err_required_plan' };
        if (!paymentMethod) return { error: 'err_required_method' };
      }
      const now = new Date().toISOString();
      const user = {
        id: uuid(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: encodePassword(password),
        securityCode: securityCode.trim().toUpperCase(),
        phone: (phone || '').trim(),
        cpf: cpf ? (isBR ? String(cpf).replace(/\D/g, '') : String(cpf).trim()) : '',
        country: (country || 'BR').toUpperCase(),
        city: (city || '').trim(),
        state: isBR ? (state || '').trim().toUpperCase() : (state || '').trim(),
        planId: planId || '',
        paymentMethod: paymentMethod || '',
        currency: currency || 'BRL',
        role: role === 'admin' ? 'admin' : 'user',
        // New accounts get immediate access ('pending'); if the admin hasn't
        // confirmed payment and activated them within 24h, they auto-suspend
        // (see syncExpiredPending) — their debt data is never deleted by this.
        status: role === 'admin' ? 'active' : 'pending',
        pendingSince: now,
        createdAt: now,
      };
      all.push(user);
      save(KEYS.users, all);
      return { user };
    },

    /* Admin-only edit of a user's account/profile fields (never touches password/email/role). */
    adminUpdate(userId, { name, phone, cpf, country, city, state, planId, paymentMethod, currency }) {
      const all = this.getAll();
      const idx = all.findIndex(u => u.id === userId);
      if (idx < 0) return { error: 'err_user_not_found' };
      const isBR = (country || all[idx].country || 'BR') === 'BR';
      all[idx] = {
        ...all[idx],
        name: name != null ? name.trim() : all[idx].name,
        phone: phone != null ? phone.trim() : all[idx].phone,
        cpf: cpf != null ? (isBR ? String(cpf).replace(/\D/g, '') : String(cpf).trim()) : all[idx].cpf,
        country: country != null ? country.toUpperCase() : (all[idx].country || 'BR'),
        city: city != null ? city.trim() : all[idx].city,
        state: state != null ? (isBR ? state.trim().toUpperCase() : state.trim()) : all[idx].state,
        planId: planId != null ? planId : all[idx].planId,
        paymentMethod: paymentMethod != null ? paymentMethod : all[idx].paymentMethod,
        currency: currency != null ? currency : (all[idx].currency || 'BRL'),
      };
      save(KEYS.users, all);
      return { user: all[idx] };
    },

    /* User-facing: the user editing their own registration data (never CPF/email/password). */
    updateProfile(userId, fields) {
      return this.adminUpdate(userId, fields);
    },

    /* Admin-only: permanently remove a user account and everything tied to it. */
    delete(userId) {
      const all = this.getAll().filter(u => u.id !== userId);
      save(KEYS.users, all);
      save(KEYS.credores, load(KEYS.credores).filter(c => c.userId !== userId));
      save(KEYS.debitos, load(KEYS.debitos).filter(d => d.userId !== userId));
      save(KEYS.pagamentos, load(KEYS.pagamentos).filter(p => p.userId !== userId));
      save(KEYS.billing, load(KEYS.billing).filter(b => b.userId !== userId));
      return { success: true };
    },

    /* Explicit admin action: activate / suspend / re-activate an account. */
    setStatus(userId, status) {
      const all = this.getAll();
      const idx = all.findIndex(u => u.id === userId);
      if (idx < 0) return { error: 'err_user_not_found' };
      all[idx].status = status;
      save(KEYS.users, all);
      if (DH.state.currentUser && DH.state.currentUser.id === userId) {
        DH.state.currentUser.status = status;
        save(KEYS.session, DH.state.currentUser);
      }
      return { user: all[idx] };
    },

    /* Sweep: any 'pending' account past the 24h grace window auto-suspends
       (access blocked) but nothing about their data is touched or removed.
       Runs at admin panel load and right before a login check. */
    syncExpiredPending() {
      const all = this.getAll();
      const now = Date.now();
      let changed = false;
      all.forEach(u => {
        if (u.status === 'pending' && u.pendingSince) {
          const ageMs = now - new Date(u.pendingSince).getTime();
          if (ageMs > 24 * 60 * 60 * 1000) { u.status = 'suspended'; changed = true; }
        }
      });
      if (changed) save(KEYS.users, all);
    },

    /* Ensure a default admin account exists (client-side only — see admin.html notes). */
    seedAdmin() {
      const all = this.getAll();
      if (all.some(u => u.role === 'admin')) return;
      all.push({
        id: uuid(),
        name: 'Administrador',
        email: 'admin@debithub.local',
        password: encodePassword('Admin@123'),
        securityCode: 'ADMIN0001',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      save(KEYS.users, all);
    },

    /* Account list for the admin panel — never includes password or securityCode. */
    listForAdmin() {
      this.syncExpiredPending();
      return this.getAll()
        .filter(u => u.role !== 'admin')
        .map(u => {
          const credCount = load(KEYS.credores).filter(c => c.userId === u.id).length;
          const debitCount = load(KEYS.debitos).filter(d => d.userId === u.id).length;
          const paymentCount = load(KEYS.pagamentos).filter(p => p.userId === u.id).length;
          const latestBill = billing.latestForUser(u.id);
          const registeredPlan = u.planId ? plans.getById(u.planId) : null;
          const isBR = (u.country || 'BR') === 'BR';
          return {
            id: u.id, name: u.name, email: u.email, createdAt: u.createdAt,
            phone: u.phone || '', cpf: u.cpf ? (isBR ? formatCPF(u.cpf) : u.cpf) : '',
            isBR,
            country: u.country || 'BR',
            city: u.city || '', state: u.state || '',
            currency: u.currency || 'BRL',
            status: u.status || 'active',
            pendingSince: u.pendingSince || '',
            registeredPlanId: u.planId || '',
            registeredPlanName: registeredPlan ? registeredPlan.name : '',
            registeredMethod: u.paymentMethod || '',
            credCount, debitCount, paymentCount,
            plan: latestBill ? latestBill.plan : '',
            method: latestBill ? latestBill.method : '',
            current: billing.isCurrent(u.id),
            lastPaymentDate: latestBill ? latestBill.date : '',
            lastPaymentAmount: latestBill ? latestBill.amount : 0,
          };
        });
    },

    authenticate(email, password) {
      this.syncExpiredPending();
      const user = this.getByEmail(email);
      if (!user) return { error: 'err_user_not_found' };
      if (!verifyPassword(password, user.password)) return { error: 'err_wrong_password' };
      if (user.role !== 'admin' && user.status === 'suspended') return { error: 'err_account_suspended' };
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

    /* Self-contained snapshot for the public share link (works for anyone, any device) */
    snapshotFor(creditorId) {
      const credor = this.getById(creditorId);
      if (!credor) return null;
      const debtor = users.getById(credor.userId);
      const allDebits = load(KEYS.debitos).filter(d => d.creditorId === creditorId);
      const debitIds = new Set(allDebits.map(d => d.id));
      const allPayments = load(KEYS.pagamentos).filter(p => debitIds.has(p.debitId));
      return {
        v: 1,
        credor: { name: credor.name, city: credor.city, state: credor.state, phone: credor.phone },
        debtor: { name: debtor ? debtor.name : '' },
        debits: allDebits.map(d => ({
          id: d.id, description: d.description, date: d.date, amount: d.amount,
          currency: d.currency || 'BRL', category: d.category || '',
          type: d.type, installments: d.installments, installmentAmount: d.installmentAmount, status: d.status,
        })),
        payments: allPayments.map(p => ({ id: p.id, debitId: p.debitId, amount: p.amount, date: p.date, note: p.note || '' })),
      };
    },

    buildShareLink(creditorId) {
      const snap = this.snapshotFor(creditorId);
      if (!snap) return null;
      const encoded = share.encode(snap);
      const base = window.location.origin + window.location.pathname.replace('dashboard.html', '');
      return `${base}credor.html#d=${encoded}`;
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

    create(userId, { creditorId, description, date, amount, type, installments, currency, category }) {
      const all = load(KEYS.debitos);
      amount = parseFloat(amount);
      installments = parseInt(installments) || 1;
      const installmentAmount = type === 'installment' ? +(amount / installments).toFixed(2) : amount;

      const debit = {
        id: uuid(), userId, creditorId,
        description: description.trim(),
        date,
        amount,
        currency: currency || 'BRL',
        category: category || '',
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
        currency: fields.currency || 'BRL',
        category: fields.category || '',
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

    update(id, { amount, date, note }) {
      const all = load(KEYS.pagamentos);
      const idx = all.findIndex(p => p.id === id);
      if (idx < 0) return null;
      all[idx] = { ...all[idx], amount: parseFloat(amount), date, note: (note || '').trim() };
      save(KEYS.pagamentos, all);
      debitos.updateStatus(all[idx].debitId);
      return all[idx];
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

  /* Canonical plan display order — Teste, Mensal, Trimestral, Semestral, Anual, then anything custom last. */
  const PLAN_SORT_ORDER = { teste: 0, mensal: 1, trimestral: 2, semestral: 3, anual: 4 };
  function planSortKey(p) {
    if (typeof p.order === 'number') return p.order;
    const key = PLAN_SORT_ORDER[(p.name || '').trim().toLowerCase()];
    return key !== undefined ? key : 99;
  }

  /* If every debit shares one currency, use it for aggregate display; otherwise fall back to BRL. */
  function dominantCurrency(debits) {
    const codes = [...new Set(debits.map(d => d.currency || 'BRL'))];
    return codes.length === 1 ? codes[0] : 'BRL';
  }

  /* Parse a 'YYYY-MM-DD' date string as local midnight (not UTC), so range
     comparisons don't shift a day off near timezone boundaries. */
  function localDate(dateStr) {
    return new Date(dateStr + (String(dateStr).includes('T') ? '' : 'T00:00:00'));
  }

  /* ══════════════════════════════
     PLATFORM BILLING (admin-only)
     Subscription payments users make TO the platform owner —
     entered manually by the admin. Separate from `pagamentos`,
     which are debt payments between the app's own users and
     the people they owe.
  ══════════════════════════════ */
  const billing = {
    getAll() { return load(KEYS.billing); },
    getByUser(userId) { return this.getAll().filter(b => b.userId === userId); },

    latestForUser(userId) {
      const list = this.getByUser(userId).sort((a, b) => localDate(b.date) - localDate(a.date));
      return list[0] || null;
    },

    /* "Em dia" if there's a payment within the last 30 days; otherwise "inadimplente". */
    isCurrent(userId) {
      const latest = this.latestForUser(userId);
      if (!latest) return false;
      const days = (Date.now() - localDate(latest.date).getTime()) / 86400000;
      return days <= 30;
    },

    create({ userId, method, plan, amount, date, note }) {
      const all = this.getAll();
      const record = {
        id: uuid(), userId,
        method, // 'pix' | 'card' | 'boleto' | 'bonus'
        plan: (plan || '').trim(),
        amount: parseFloat(amount) || 0,
        date,
        note: (note || '').trim(),
        createdAt: new Date().toISOString(),
      };
      all.push(record);
      save(KEYS.billing, all);
      return record;
    },

    update(id, { method, plan, amount, date, note }) {
      const all = this.getAll();
      const idx = all.findIndex(b => b.id === id);
      if (idx < 0) return null;
      all[idx] = {
        ...all[idx],
        method, plan: (plan || '').trim(), amount: parseFloat(amount) || 0, date, note: (note || '').trim(),
      };
      save(KEYS.billing, all);
      return all[idx];
    },

    delete(id) {
      save(KEYS.billing, this.getAll().filter(b => b.id !== id));
    },

    /* Revenue summary within an optional [from, to] range (Date objects, or null for open-ended). */
    summary(from, to) {
      const inRange = (dateStr) => {
        if (!from && !to) return true;
        const dt = localDate(dateStr);
        if (from && dt < from) return false;
        if (to   && dt > to)   return false;
        return true;
      };
      const filtered = this.getAll().filter(b => inRange(b.date));
      return {
        revenue: filtered.reduce((s, b) => s + b.amount, 0),
        paymentCount: filtered.length,
      };
    },
  };

  /* ══════════════════════════════
     PLANS (admin-managed subscription plans)
     Shown as choices on the registration form; whatever the
     admin edits here is what new signups see.
  ══════════════════════════════ */
  const plans = {
    getAll() {
      // Transparently upgrade legacy single-`price` plans to the multi-currency shape.
      const all = load(KEYS.plans).map(p => p.prices ? p : { ...p, prices: { BRL: p.price || 0, USD: 0, EUR: 0 } });
      return all.sort((a, b) => planSortKey(a) - planSortKey(b));
    },
    getAllActive() { return this.getAll().filter(p => p.active !== false); },
    getById(id) { return this.getAll().find(p => p.id === id) || null; },

    /* Price of a plan in a given currency; falls back to BRL if that currency wasn't set. */
    priceFor(plan, currency) {
      if (!plan || !plan.prices) return 0;
      const code = currency || 'BRL';
      return plan.prices[code] || plan.prices.BRL || 0;
    },

    create({ name, prices, period }) {
      const all = load(KEYS.plans);
      const plan = {
        id: uuid(),
        name: (name || '').trim(),
        prices: { BRL: parseFloat(prices?.BRL) || 0, USD: parseFloat(prices?.USD) || 0, EUR: parseFloat(prices?.EUR) || 0 },
        period: period || 'monthly', // 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'unlimited'
        active: true,
        createdAt: new Date().toISOString(),
      };
      all.push(plan);
      save(KEYS.plans, all);
      return plan;
    },

    update(id, { name, prices, period }) {
      const all = this.getAll();
      const idx = all.findIndex(p => p.id === id);
      if (idx < 0) return null;
      all[idx] = {
        ...all[idx],
        name: (name || '').trim(),
        prices: { BRL: parseFloat(prices?.BRL) || 0, USD: parseFloat(prices?.USD) || 0, EUR: parseFloat(prices?.EUR) || 0 },
        period: period || all[idx].period,
      };
      save(KEYS.plans, all);
      return all[idx];
    },

    /* Hard-delete only if no account references this plan; otherwise the caller should deactivate it instead. */
    delete(id) {
      const inUse = load(KEYS.users).some(u => u.planId === id);
      if (inUse) return { error: 'err_plan_in_use' };
      save(KEYS.plans, this.getAll().filter(p => p.id !== id));
      return { success: true };
    },

    /* Seed sensible defaults on first run — matches the pricing advertised on the landing page. */
    seedDefaults() {
      if (this.getAll().length > 0) return;
      this.create({ name: 'Teste',      prices: { BRL: 0,   USD: 0,  EUR: 0  }, period: 'unlimited' });
      this.create({ name: 'Mensal',     prices: { BRL: 29,  USD: 5.9, EUR: 5.5 }, period: 'monthly' });
      this.create({ name: 'Trimestral', prices: { BRL: 81,  USD: 16, EUR: 15 }, period: 'quarterly' });
      this.create({ name: 'Semestral',  prices: { BRL: 157, USD: 31, EUR: 29 }, period: 'semiannual' });
      this.create({ name: 'Anual',      prices: { BRL: 299, USD: 59, EUR: 55 }, period: 'annual' });
    },

    /* Keeps installs created before Teste/Trimestral existed in sync with the current
       catalog, without touching any custom plans the admin already added themselves. */
    reconcileDefaults() {
      const all = this.getAll();
      const find = n => all.find(p => p.name.trim().toLowerCase() === n);
      if (!find('teste'))      this.create({ name: 'Teste', prices: { BRL: 0, USD: 0, EUR: 0 }, period: 'unlimited' });
      if (!find('trimestral')) this.create({ name: 'Trimestral', prices: { BRL: 81, USD: 16, EUR: 15 }, period: 'quarterly' });
      const mensal = find('mensal');
      if (mensal && mensal.prices.BRL !== 29) {
        this.update(mensal.id, { name: mensal.name, prices: { ...mensal.prices, BRL: 29 }, period: mensal.period });
      }
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

      const inRange = (dateStr) => {
        if (!from && !to) return true;
        const dt = localDate(dateStr);
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
        const dt = localDate(d.date);
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
        currency: dominantCurrency(filteredDebits),
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
        const dt = localDate(d.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });
      const thisMonthPaid = ps.filter(p => {
        const dt = localDate(p.date);
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      });

      return {
        totalDebt, totalPaid, balance,
        currency: dominantCurrency(ds),
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
      };
    },
    setTheme(t)    { localStorage.setItem('dh_theme', t);    DH.state.theme = t; },
    setLanguage(l) { localStorage.setItem('dh_language', l); DH.state.language = l; },
  };

  /* Cities already typed anywhere in the system (credores + users), for the city suggestion list. */
  function distinctCities() {
    const cities = new Set();
    load(KEYS.credores).forEach(c => { if (c.city) cities.add(c.city.trim()); });
    load(KEYS.users).forEach(u => { if (u.city) cities.add(u.city.trim()); });
    return [...cities].sort((a, b) => a.localeCompare(b));
  }

  /* Cities already typed anywhere in the system, narrowed to a single state (UF) —
     used so the city suggestion list only shows once a state has been chosen. */
  function distinctCitiesForState(state) {
    if (!state) return [];
    const uf = String(state).trim().toUpperCase();
    const cities = new Set();
    load(KEYS.credores).forEach(c => { if (c.city && (c.state || '').toUpperCase() === uf) cities.add(c.city.trim()); });
    load(KEYS.users).forEach(u => { if (u.city && (u.state || '').toUpperCase() === uf) cities.add(u.city.trim()); });
    return [...cities].sort((a, b) => a.localeCompare(b));
  }

  users.seedAdmin();
  plans.seedDefaults();
  plans.reconcileDefaults();

  /* ── Public API ── */
  return { uuid, toSlug, share, users, session, credores, debitos, pagamentos, billing, plans, analytics, settings, isValidCPF, formatCPF, distinctCities, distinctCitiesForState };
})();

/* ══════════════════════════════════════════
   Geography — countries & Brazilian states
   (curated list; not the full ISO-3166 set)
══════════════════════════════════════════ */
DH.geo = (() => {
  const BR_STATES = [
    ['AC','Acre'], ['AL','Alagoas'], ['AP','Amapá'], ['AM','Amazonas'], ['BA','Bahia'],
    ['CE','Ceará'], ['DF','Distrito Federal'], ['ES','Espírito Santo'], ['GO','Goiás'],
    ['MA','Maranhão'], ['MT','Mato Grosso'], ['MS','Mato Grosso do Sul'], ['MG','Minas Gerais'],
    ['PA','Pará'], ['PB','Paraíba'], ['PR','Paraná'], ['PE','Pernambuco'], ['PI','Piauí'],
    ['RJ','Rio de Janeiro'], ['RN','Rio Grande do Norte'], ['RS','Rio Grande do Sul'],
    ['RO','Rondônia'], ['RR','Roraima'], ['SC','Santa Catarina'], ['SP','São Paulo'],
    ['SE','Sergipe'], ['TO','Tocantins'],
  ].sort((a, b) => a[1].localeCompare(b[1], 'pt'));

  const COUNTRIES = [
    ['BR','Brasil','Brazil'], ['US','Estados Unidos','United States'], ['PT','Portugal','Portugal'],
    ['AR','Argentina','Argentina'], ['CA','Canadá','Canada'], ['MX','México','Mexico'],
    ['ES','Espanha','Spain'], ['FR','França','France'], ['DE','Alemanha','Germany'],
    ['IT','Itália','Italy'], ['GB','Reino Unido','United Kingdom'], ['CL','Chile','Chile'],
    ['CO','Colômbia','Colombia'], ['PY','Paraguai','Paraguay'], ['UY','Uruguai','Uruguay'],
    ['PE','Peru','Peru'], ['BO','Bolívia','Bolivia'], ['VE','Venezuela','Venezuela'],
    ['EC','Equador','Ecuador'], ['JP','Japão','Japan'], ['CN','China','China'],
    ['IN','Índia','India'], ['AU','Austrália','Australia'], ['NZ','Nova Zelândia','New Zealand'],
    ['ZA','África do Sul','South Africa'], ['NL','Países Baixos','Netherlands'], ['BE','Bélgica','Belgium'],
    ['CH','Suíça','Switzerland'], ['AT','Áustria','Austria'], ['SE','Suécia','Sweden'],
    ['NO','Noruega','Norway'], ['DK','Dinamarca','Denmark'], ['FI','Finlândia','Finland'],
    ['IE','Irlanda','Ireland'], ['PL','Polônia','Poland'], ['RU','Rússia','Russia'],
    ['KR','Coreia do Sul','South Korea'], ['SG','Singapura','Singapore'],
    ['AE','Emirados Árabes Unidos','United Arab Emirates'], ['IL','Israel','Israel'],
    ['GR','Grécia','Greece'], ['TR','Turquia','Turkey'], ['EG','Egito','Egypt'],
    ['MA','Marrocos','Morocco'], ['AO','Angola','Angola'], ['MZ','Moçambique','Mozambique'],
    ['CV','Cabo Verde','Cape Verde'], ['CU','Cuba','Cuba'], ['DO','República Dominicana','Dominican Republic'],
    ['CR','Costa Rica','Costa Rica'], ['PA','Panamá','Panama'], ['GT','Guatemala','Guatemala'],
    ['HN','Honduras','Honduras'], ['SV','El Salvador','El Salvador'], ['NI','Nicarágua','Nicaragua'],
    ['JM','Jamaica','Jamaica'], ['TT','Trinidad e Tobago','Trinidad and Tobago'], ['IS','Islândia','Iceland'],
    ['LU','Luxemburgo','Luxembourg'], ['CZ','República Tcheca','Czech Republic'], ['HU','Hungria','Hungary'],
    ['RO','Romênia','Romania'], ['UA','Ucrânia','Ukraine'], ['TH','Tailândia','Thailand'],
    ['VN','Vietnã','Vietnam'], ['PH','Filipinas','Philippines'], ['MY','Malásia','Malaysia'],
    ['ID','Indonésia','Indonesia'], ['SA','Arábia Saudita','Saudi Arabia'], ['QA','Catar','Qatar'],
  ];

  function countries(lang) {
    const nameIdx = lang === 'en' ? 2 : 1;
    return COUNTRIES
      .map(c => ({ code: c[0], name: c[nameIdx] }))
      .sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'pt'));
  }

  function states() {
    return BR_STATES.map(s => ({ uf: s[0], name: s[1] }));
  }

  return { countries, states };
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

  function format(amount, currencyCode) {
    const code = currencyCode || 'BRL';
    const cfg  = configs[code] || configs.BRL;
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency', currency: cfg.currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(amount || 0);
  }

  return { format, list: () => Object.keys(configs) };
})();

/* ══════════════════════════════════════════
   Date utilities
══════════════════════════════════════════ */
DH.dates = (() => {
  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString + (isoString.includes('T') ? '' : 'T00:00:00'));
    const lang = DH.state.language || 'pt';
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', opts);
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

  /* Revenue filter range: last 30 days (default), 3/6/12 months, or all time. */
  function rangeForBilling(filter) {
    const now = new Date();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let from;
    switch (filter) {
      case '30d':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
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
        from = null; // 'all'
    }
    return { from, to };
  }

  return { formatDate, formatMonthYear, today, rangeFromFilter, rangeForBilling };
})();
