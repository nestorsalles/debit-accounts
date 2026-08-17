/* ============================================================
   DebitHub — Public Creditor View
   Renders the public-facing page at credor.html#slug
   ============================================================ */

window.DH = window.DH || {};

DH.credorView = (() => {
  function T(k) { return DH.i18n.t(k); }
  function C(v) { return DH.currency.format(v); }

  let showingExtrato = false;

  function init() {
    // Read slug from hash
    const slug = window.location.hash.replace('#', '').trim();
    if (!slug) { renderNotFound(); return; }

    const credor = DH.data.credores.getBySlug(slug);
    if (!credor) { renderNotFound(); return; }

    renderDashboard(credor);
  }

  function renderNotFound() {
    document.getElementById('credor-content').innerHTML = `
      <div class="empty-state" style="padding:4rem 2rem;">
        <div class="empty-icon">😕</div>
        <h3>${T('pub_not_found')}</h3>
        <p>${T('pub_not_found_sub')}</p>
      </div>
    `;
  }

  function renderDashboard(credor) {
    showingExtrato = false;
    const s       = DH.data.analytics.creditorSummary(credor.id);
    const debits  = DH.data.debitos.getByCreditor(credor.id);
    const payments = DH.data.pagamentos.getByCreditor(credor.id);

    // Current month active debits
    const now = new Date();
    const thisMonthDebits = debits.filter(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    });
    const futureDebits = debits.filter(d => {
      const dt = new Date(d.date + 'T00:00:00');
      return dt > now && d.status !== 'paid';
    });

    // Update hero
    const heroName = document.getElementById('hero-name');
    const heroSub  = document.getElementById('hero-sub');
    if (heroName) heroName.textContent = credor.name;
    if (heroSub)  heroSub.textContent  = `📍 ${credor.city}/${credor.state}`;

    const content = document.getElementById('credor-content');
    if (!content) return;

    content.innerHTML = `
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card" style="--accent-color:var(--danger)">
          <div class="stat-icon">💰</div>
          <div class="stat-label">${T('pub_total')}</div>
          <div class="stat-value" style="color:var(--danger)">${C(s.balance)}</div>
          <div class="stat-sub">${s.activeDebits.length} ${T('label_open')}</div>
        </div>
        <div class="stat-card" style="--accent-color:var(--success)">
          <div class="stat-icon">✅</div>
          <div class="stat-label">${T('pub_paid')}</div>
          <div class="stat-value" style="color:var(--success)">${C(s.totalPaid)}</div>
          <div class="stat-sub">${s.paymentCount} ${T('label_payments')}</div>
        </div>
        <div class="stat-card" style="--accent-color:var(--warning)">
          <div class="stat-icon">📅</div>
          <div class="stat-label">${T('pub_this_month')}</div>
          <div class="stat-value" style="color:var(--warning)">${C(s.thisMonthDebt)}</div>
          <div class="stat-sub">${now.toLocaleDateString('pt-BR', {month:'long', year:'numeric'})}</div>
        </div>
      </div>

      <!-- This Month -->
      <div class="card">
        <div class="section-header">
          <div class="section-title">📅 ${T('pub_this_month_title')}</div>
        </div>
        ${thisMonthDebits.length === 0
          ? `<p class="text-muted text-small" style="padding:.5rem 0;">${T('pub_no_debt_month')}</p>`
          : `<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.75rem;">
              ${thisMonthDebits.map(d => renderDebitItem(d)).join('')}
            </div>`
        }
      </div>

      <!-- Active Debits -->
      <div class="card">
        <div class="section-header">
          <div class="section-title">🔴 ${T('pub_active')}</div>
        </div>
        ${s.activeDebits.length === 0
          ? `<p class="text-muted text-small" style="padding:.5rem 0;">${T('pub_no_debt')}</p>`
          : `<div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.75rem;">
              ${s.activeDebits.map(d => renderDebitItem(d)).join('')}
            </div>`
        }
      </div>

      <!-- Paid Debits -->
      ${s.paidDebits.length > 0 ? `
      <div class="card">
        <div class="section-header">
          <div class="section-title">✅ ${T('pub_paid_title')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.6rem;margin-top:.75rem;">
          ${s.paidDebits.map(d => renderDebitItem(d)).join('')}
        </div>
      </div>` : ''}

      <!-- Extrato button -->
      <button class="btn btn-ghost w-full" style="margin-top:.5rem;"
        onclick="DH.credorView.showExtrato('${credor.id}')">
        ${T('pub_btn_extrato')}
      </button>
    `;
  }

  function renderDebitItem(d) {
    const paid = DH.data.pagamentos.totalPaidForDebit(d.id);
    const rem  = Math.max(0, d.amount - paid);
    return `
      <div class="debit-item" style="cursor:default;">
        <div class="debit-item-icon" style="background:${d.status === 'paid' ? 'var(--success-dim)' : 'var(--danger-dim)'}">
          ${d.type === 'recurring' ? '🔄' : d.type === 'installment' ? '📅' : '💸'}
        </div>
        <div class="debit-item-body">
          <div class="debit-item-desc">${d.description}</div>
          <div class="debit-item-meta">
            ${DH.ui.typeChip(d.type, d.installments)}
            · ${DH.dates.formatDate(d.date)}
            ${d.type === 'installment' ? `<br><span class="text-xs" style="color:var(--success)">Pago: ${DH.currency.format(paid)} · Restante: ${DH.currency.format(rem)}</span>` : ''}
          </div>
        </div>
        <div class="debit-item-right">
          <div class="debit-item-amount" style="${d.status === 'paid' ? 'text-decoration:line-through;color:var(--text-muted)' : 'color:var(--danger);font-weight:700;'}">
            ${DH.currency.format(d.amount)}
          </div>
          ${DH.ui.statusBadge(d.status)}
        </div>
      </div>
    `;
  }

  function showExtrato(creditorId) {
    showingExtrato = true;
    const payments = DH.data.pagamentos.getByCreditor(creditorId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const credor   = DH.data.credores.getById(creditorId);
    const content  = document.getElementById('credor-content');

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
        <button class="btn btn-ghost btn-sm" onclick="DH.credorView.init()">${T('pub_btn_back')}</button>
        <h2 class="section-title">📋 ${T('pub_full_statement')}</h2>
      </div>
      ${payments.length === 0
        ? DH.ui.emptyState('💸', 'payment_empty', 'payment_empty_sub')
        : `<div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>${T('debit_description')}</th>
                  <th>${T('payment_date')}</th>
                  <th>${T('payment_amount')}</th>
                  <th>${T('payment_note')}</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => {
                  const deb = DH.data.debitos.getById(p.debitId);
                  return `
                    <tr>
                      <td><strong>${deb ? deb.description : '—'}</strong></td>
                      <td>${DH.dates.formatDate(p.date)}</td>
                      <td style="color:var(--success);font-weight:700;">+ ${DH.currency.format(p.amount)}</td>
                      <td class="text-muted">${p.note || '—'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="text-align:right;margin-top:1rem;font-weight:700;color:var(--success);">
            ${T('label_total_received')}: ${DH.currency.format(payments.reduce((s, p) => s + p.amount, 0))}
          </div>`
      }
    `;
  }

  return { init, showExtrato };
})();
