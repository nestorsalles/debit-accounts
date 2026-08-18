/* ============================================================
   DebitHub — Debits & Payments Module
   ============================================================ */

window.DH = window.DH || {};

DH.debitos = (() => {
  function T(k) { return DH.i18n.t(k); }

  /* ════════════════════════════
     NEW DEBIT MODAL
  ════════════════════════════ */
  function openNewDebitModal(preselectedCreditorId) {
    const overlay = document.getElementById('debit-modal-overlay');
    if (!overlay) return;

    document.getElementById('debit-modal-title').textContent = T('modal_new_debit');
    document.getElementById('debit-form').reset();
    document.getElementById('debit-id').value = '';
    document.getElementById('debit-date').value = DH.dates.today();
    clearDebitErrors();
    populateCreditorSelect('debit-creditor', preselectedCreditorId);
    handleTypeChange();
    DH.ui.openModal('debit-modal-overlay');
  }

  /* ════════════════════════════
     EDIT DEBIT MODAL
  ════════════════════════════ */
  function openEditDebitModal(debitId) {
    const debit = DH.data.debitos.getById(debitId);
    if (!debit) return;

    document.getElementById('debit-modal-title').textContent = T('modal_edit_debit');
    document.getElementById('debit-id').value          = debitId;
    document.getElementById('debit-description').value = debit.description;
    document.getElementById('debit-date').value        = debit.date;
    document.getElementById('debit-amount').value      = debit.amount;
    document.getElementById('debit-currency').value    = debit.currency || 'BRL';
    document.getElementById('debit-category').value    = debit.category || '';
    document.getElementById('debit-type').value        = debit.type;
    clearDebitErrors();
    populateCreditorSelect('debit-creditor', debit.creditorId);
    handleTypeChange();

    if (debit.type === 'installment') {
      document.getElementById('debit-installments').value = debit.installments;
    }

    DH.ui.openModal('debit-modal-overlay');
  }

  /* ── Populate creditor select ── */
  function populateCreditorSelect(selectId, selectedId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const userId   = DH.state.currentUser?.id;
    const credores = DH.data.credores.getAll(userId);

    sel.innerHTML = `<option value="">${T('debit_select_creditor')}</option>`;
    credores.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id === selectedId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* ── Populate debit select for payment ── */
  function populateDebitSelect(selectId, creditorId, selectedId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;

    let debits = creditorId
      ? DH.data.debitos.getByCreditor(creditorId, DH.state.currentUser?.id)
      : DH.data.debitos.getAll(DH.state.currentUser?.id);

    debits = debits.filter(d => d.status !== 'paid');

    sel.innerHTML = `<option value="">${T('payment_select_debit')}</option>`;
    debits.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.description + ' — ' + DH.currency.format(d.amount, d.currency);
      if (d.id === selectedId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* ── Type change handler ── */
  function handleTypeChange() {
    const typeEl = document.getElementById('debit-type');
    const instRow = document.getElementById('installment-row');
    if (!typeEl || !instRow) return;
    const v = typeEl.value;
    instRow.classList.toggle('hidden', v !== 'installment');

    // Auto-calculate installment amount
    if (v === 'installment') {
      const amtEl  = document.getElementById('debit-amount');
      const instEl = document.getElementById('debit-installments');
      const curEl  = document.getElementById('debit-currency');
      const valEl  = document.getElementById('debit-installment-value');
      function recalc() {
        const amt  = parseFloat(amtEl?.value || 0);
        const inst = parseInt(instEl?.value || 1);
        if (amt > 0 && inst > 0 && valEl) {
          valEl.textContent = DH.currency.format(amt / inst, curEl?.value) + ' / ' + T('installments_label');
        } else if (valEl) { valEl.textContent = ''; }
      }
      amtEl?.removeEventListener('input', recalc);
      instEl?.removeEventListener('input', recalc);
      curEl?.removeEventListener('change', recalc);
      amtEl?.addEventListener('input', recalc);
      instEl?.addEventListener('input', recalc);
      curEl?.addEventListener('change', recalc);
      recalc();
    }
  }

  /* ── Save debit ── */
  function saveDebit() {
    clearDebitErrors();
    const id          = document.getElementById('debit-id').value;
    const creditorId  = document.getElementById('debit-creditor').value;
    const description = document.getElementById('debit-description').value.trim();
    const date        = document.getElementById('debit-date').value;
    const amount      = document.getElementById('debit-amount').value;
    const currency    = document.getElementById('debit-currency').value;
    const category    = document.getElementById('debit-category').value;
    const type        = document.getElementById('debit-type').value;
    const installments = document.getElementById('debit-installments')?.value || 1;

    let valid = true;
    if (!creditorId)  { showDebitErr('debit-creditor', T('err_required')); valid = false; }
    if (!description) { showDebitErr('debit-description', T('err_required')); valid = false; }
    if (!date)        { showDebitErr('debit-date', T('err_required')); valid = false; }
    if (!amount || isNaN(parseFloat(amount))) { showDebitErr('debit-amount', T('err_amount_invalid')); valid = false; }
    else if (parseFloat(amount) <= 0) { showDebitErr('debit-amount', T('err_amount_positive')); valid = false; }
    if (type === 'installment' && (!installments || parseInt(installments) < 1)) {
      showDebitErr('debit-installments', T('err_required')); valid = false;
    }
    if (!valid) return;

    const userId = DH.state.currentUser.id;

    if (id) {
      DH.data.debitos.update(id, { creditorId, description, date, amount, currency, category, type, installments });
      DH.ui.showToast(T('toast_debit_updated'), 'success');
    } else {
      DH.data.debitos.create(userId, { creditorId, description, date, amount, currency, category, type, installments });
      DH.ui.showToast(T('toast_debit_created'), 'success');
    }

    DH.ui.closeModal('debit-modal-overlay');
    DH.dashboard.renderAll();
    if (DH.dashboard.selectedCreditorId) DH.dashboard.refreshDetail();
  }

  /* ── Delete debit ── */
  function deleteDebit(debitId) {
    DH.ui.confirm(T('debit_delete_confirm'), () => {
      DH.data.debitos.delete(debitId);
      DH.ui.showToast(T('toast_debit_deleted'), 'info');
      DH.dashboard.renderAll();
      if (DH.dashboard.selectedCreditorId) DH.dashboard.refreshDetail();
    });
  }

  /* ════════════════════════════
     PAYMENT MODAL
  ════════════════════════════ */
  function openPaymentModal(preselectedCreditorId) {
    const overlay = document.getElementById('payment-modal-overlay');
    if (!overlay) return;

    document.getElementById('payment-form').reset();
    document.getElementById('payment-date').value = DH.dates.today();
    clearPaymentErrors();

    populateCreditorSelect('payment-creditor', preselectedCreditorId);

    // When creditor changes, update debit list
    const credSel = document.getElementById('payment-creditor');
    if (credSel) {
      // Populate debits for selected creditor
      const updateDebits = () => {
        const cid = credSel.value;
        populateDebitSelect('payment-debit', cid || null, null);
        // Auto-fill remaining amount when debit selected
        setupDebitAutoFill();
      };
      credSel.onchange = updateDebits;
      updateDebits();
    }

    // If preselected, populate debits
    if (preselectedCreditorId) {
      populateDebitSelect('payment-debit', preselectedCreditorId, null);
      setupDebitAutoFill();
    } else {
      populateDebitSelect('payment-debit', null, null);
      setupDebitAutoFill();
    }

    DH.ui.openModal('payment-modal-overlay');
  }

  function setupDebitAutoFill() {
    const debitSel = document.getElementById('payment-debit');
    const amtInput = document.getElementById('payment-amount');
    if (!debitSel || !amtInput) return;
    debitSel.onchange = () => {
      const debitId = debitSel.value;
      if (!debitId) { amtInput.value = ''; return; }
      const debit = DH.data.debitos.getById(debitId);
      if (!debit) return;
      const paid = DH.data.pagamentos.totalPaidForDebit(debitId);
      const rem  = Math.max(0, debit.amount - paid);
      amtInput.value = rem.toFixed(2);
    };
  }

  /* ── Save payment ── */
  function savePayment() {
    clearPaymentErrors();
    const creditorId = document.getElementById('payment-creditor').value;
    const debitId    = document.getElementById('payment-debit').value;
    const amount     = document.getElementById('payment-amount').value;
    const date       = document.getElementById('payment-date').value;
    const note       = document.getElementById('payment-note').value;

    let valid = true;
    if (!creditorId) { showPaymentErr('payment-creditor', T('err_required')); valid = false; }
    if (!debitId)    { showPaymentErr('payment-debit', T('err_required')); valid = false; }
    if (!amount || isNaN(parseFloat(amount))) { showPaymentErr('payment-amount', T('err_amount_invalid')); valid = false; }
    else if (parseFloat(amount) <= 0) { showPaymentErr('payment-amount', T('err_amount_positive')); valid = false; }
    if (!date) { showPaymentErr('payment-date', T('err_required')); valid = false; }
    if (!valid) return;

    const userId = DH.state.currentUser.id;
    DH.data.pagamentos.create(userId, { creditorId, debitId, amount, date, note });
    DH.ui.showToast(T('toast_payment_created'), 'success');
    DH.ui.closeModal('payment-modal-overlay');
    DH.dashboard.renderAll();
    if (DH.dashboard.selectedCreditorId) DH.dashboard.refreshDetail();
  }

  /* ── Error helpers ── */
  function showDebitErr(id, msg) {
    const el = document.getElementById(id + '-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    const inp = document.getElementById(id);
    if (inp) inp.style.borderColor = 'var(--danger)';
  }
  function clearDebitErrors() {
    ['debit-creditor','debit-description','debit-date','debit-amount','debit-installments'].forEach(id => {
      const el = document.getElementById(id + '-error');
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
      const inp = document.getElementById(id);
      if (inp) inp.style.borderColor = '';
    });
  }
  function showPaymentErr(id, msg) {
    const el = document.getElementById(id + '-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    const inp = document.getElementById(id);
    if (inp) inp.style.borderColor = 'var(--danger)';
  }
  function clearPaymentErrors() {
    ['payment-creditor','payment-debit','payment-amount','payment-date'].forEach(id => {
      const el = document.getElementById(id + '-error');
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
      const inp = document.getElementById(id);
      if (inp) inp.style.borderColor = '';
    });
  }

  /* ── Init ── */
  function init() {
    // Debit form submit
    const debitForm = document.getElementById('debit-form');
    if (debitForm) {
      debitForm.addEventListener('submit', e => { e.preventDefault(); saveDebit(); });
    }
    // Payment form submit
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
      paymentForm.addEventListener('submit', e => { e.preventDefault(); savePayment(); });
    }
    // Type change
    const typeEl = document.getElementById('debit-type');
    if (typeEl) typeEl.addEventListener('change', handleTypeChange);

    // Amount masking (allow only numeric + decimal)
    ['debit-amount','payment-amount'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', () => {
        const v = parseFloat(el.value);
        if (!isNaN(v)) el.value = v.toFixed(2);
      });
    });
  }

  return {
    openNewDebitModal,
    openEditDebitModal,
    openPaymentModal,
    saveDebit,
    savePayment,
    deleteDebit,
    handleTypeChange,
    init,
  };
})();
