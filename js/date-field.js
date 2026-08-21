/* ============================================================
   DebitHub — Date Field
   Native <input type="date"> always displays in the browser/OS
   locale format, which we can't control. This wraps a plain text
   input with digit masking + a native picker fallback, so the
   displayed format always follows the app's own language setting:
   dd/mm/yyyy by default, mm/dd/yyyy when the app language is English.
   The underlying value is always stored/read as ISO 'YYYY-MM-DD'.
   ============================================================ */

window.DH = window.DH || {};

DH.dateField = (() => {
  function orderMDY() { return DH.state.language === 'en'; }

  function toDisplay(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return orderMDY() ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
  }

  function toISO(display) {
    const parts = String(display || '').split('/');
    if (parts.length !== 3) return '';
    let d, m, y;
    if (orderMDY()) { [m, d, y] = parts; } else { [d, m, y] = parts; }
    if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return '';
    d = d.padStart(2, '0'); m = m.padStart(2, '0');
    if (+m < 1 || +m > 12 || +d < 1 || +d > 31) return '';
    return `${y}-${m}-${d}`;
  }

  function maskInput(e) {
    const el = e.target;
    const digits = el.value.replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 4) out = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
    else if (digits.length > 2) out = digits.slice(0, 2) + '/' + digits.slice(2);
    el.value = out;
    const iso = toISO(out);
    if (iso) el.dataset.iso = iso; else delete el.dataset.iso;
  }

  function refreshPlaceholder(input) {
    input.placeholder = orderMDY() ? 'mm/dd/yyyy' : 'dd/mm/aaaa';
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-date-field]').forEach(input => {
      refreshPlaceholder(input);

      if (input.dataset.dateFieldMounted) return;
      input.dataset.dateFieldMounted = '1';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('inputmode', 'numeric');
      input.addEventListener('input', maskInput);

      let wrapper = input.parentElement;
      if (!wrapper || !wrapper.classList.contains('date-field')) {
        wrapper = document.createElement('span');
        wrapper.className = 'date-field';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
      }

      const nativeInput = document.createElement('input');
      nativeInput.type = 'date';
      nativeInput.className = 'date-native-picker';
      nativeInput.tabIndex = -1;
      nativeInput.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(nativeInput);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'date-picker-btn';
      btn.setAttribute('data-icon', 'calendar');
      btn.tabIndex = -1;
      wrapper.appendChild(btn);
      DH.icons.mount(wrapper);

      btn.addEventListener('click', () => {
        const iso = toISO(input.value);
        if (iso) nativeInput.value = iso;
        if (typeof nativeInput.showPicker === 'function') {
          try { nativeInput.showPicker(); return; } catch (err) { /* fall through */ }
        }
        nativeInput.focus();
        nativeInput.click();
      });
      nativeInput.addEventListener('change', () => {
        if (nativeInput.value) {
          input.value = toDisplay(nativeInput.value);
          input.dataset.iso = nativeInput.value;
        }
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function getISO(input) { return typeof input === 'string' ? '' : (toISO(input.value) || input.dataset.iso || ''); }
  function setISO(input, iso) {
    input.value = toDisplay(iso);
    if (iso) input.dataset.iso = iso; else delete input.dataset.iso;
  }

  /* Re-render every mounted field's displayed text in the current language's
     format, using each field's cached ISO value as the source of truth. */
  function reformatAll(root) {
    (root || document).querySelectorAll('[data-date-field]').forEach(input => {
      refreshPlaceholder(input);
      if (input.dataset.iso) input.value = toDisplay(input.dataset.iso);
    });
  }

  return { mount, getISO, setISO, toDisplay, toISO, reformatAll };
})();
