/* ============================================================
   DebitHub — Money Field
   Plain text input masked as the user types into "1.234,56"
   (dot thousands, comma cents) — no browser spinner arrows,
   no locale-dependent number parsing. The raw numeric value is
   read back with getValue(); currency symbol is shown separately
   (label / adjacent select), this only masks the digits.
   ============================================================ */

window.DH = window.DH || {};

DH.moneyField = (() => {
  function formatDigits(digits) {
    digits = String(digits || '').replace(/\D/g, '');
    if (!digits) return '';
    digits = digits.replace(/^0+(?=\d)/, '');
    while (digits.length < 3) digits = '0' + digits;
    const cents = digits.slice(-2);
    const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return grouped + ',' + cents;
  }

  function toNumber(display) {
    if (!display) return 0;
    const normalized = String(display).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
  }

  function mount(root) {
    (root || document).querySelectorAll('[data-money-field]').forEach(input => {
      if (input.dataset.moneyMounted) return;
      input.dataset.moneyMounted = '1';
      input.setAttribute('inputmode', 'decimal');
      input.setAttribute('autocomplete', 'off');
      input.addEventListener('input', () => {
        input.value = formatDigits(input.value);
      });
    });
  }

  function getValue(input) {
    return toNumber(typeof input === 'string' ? input : (input ? input.value : ''));
  }

  function setValue(input, num) {
    const cents = Math.round((parseFloat(num) || 0) * 100);
    input.value = cents === 0 ? '' : formatDigits(String(cents));
  }

  return { mount, getValue, setValue, format: formatDigits, toNumber };
})();
