/* ============================================================
   DebitHub — Internationalization (i18n)
   Supports: Portuguese (pt) | English (en)
   ============================================================ */

window.DH = window.DH || {};

DH.i18n = (() => {
  const translations = {
    pt: {
      // Brand
      brand_name:     'DebitHub',
      brand_tagline:  'Controle inteligente de débitos pessoais',

      // Auth
      login_tab:      'Entrar',
      login_subtitle: 'Acesse sua conta',
      register_tab:   'Criar Conta',
      register_subtitle: 'Novo por aqui? Cadastre-se',
      field_name:     'Nome completo',
      field_email:    'E-mail',
      field_password: 'Senha',
      field_confirm_password: 'Confirmar senha',
      field_security_code: 'Código de segurança',
      btn_login:      'Entrar',
      btn_register:   'Criar conta',
      forgot_password: 'Esqueci minha senha',
      forgot_title:   'Recuperar senha',
      forgot_desc:    'Informe seu e-mail e o código de segurança que você criou no cadastro para redefinir sua senha.',
      field_new_password: 'Nova senha',
      btn_reset:      'Redefinir senha',
      back_login:     'Voltar para o login',
      security_hint:  '🔐 Crie um código alfanumérico (ex: ABC123) para usar na recuperação de senha caso você esqueça. Guarde-o em local seguro.',
      password_strength_1: 'Fraca',
      password_strength_2: 'Razoável',
      password_strength_3: 'Boa',
      password_strength_4: 'Forte',
      change_password_title: 'Alterar senha',
      field_current_password: 'Senha atual',
      btn_change_password: 'Alterar senha',

      // Nav
      nav_overview:   'Visão Geral',
      nav_credores:   'Credores',
      nav_debitos:    'Débitos',
      nav_payments:   'Pagamentos',
      nav_settings:   'Configurações',
      nav_logout:     'Sair',
      nav_profile:    'Meu Perfil',

      // Dashboard
      dash_title:     'Visão Geral',
      dash_subtitle:  'Acompanhe seus débitos e pagamentos',
      stat_total_debt:   'Débito total ativo',
      stat_total_paid:   'Total pago',
      stat_this_month:   'A pagar este mês',
      stat_credores:     'Credores ativos',
      filter_today:   'Hoje',
      filter_month:   'Este mês',
      filter_3m:      '3 meses',
      filter_6m:      '6 meses',
      filter_1y:      '1 ano',
      filter_custom:  'Personalizado',
      filter_label:   'Período:',
      filter_from:    'De',
      filter_to:      'Até',

      // Credores
      credores_title:    'Credores',
      credores_subtitle: 'Pessoas para quem você deve',
      btn_new_credor:    '+ Novo credor',
      btn_new_debit:     '+ Novo débito',
      btn_new_payment:   '+ Registrar pagamento',
      credor_name:       'Nome do credor',
      credor_city:       'Cidade',
      credor_state:      'Estado (UF)',
      credor_phone:      'Telefone',
      credor_link:       '🔗 Link do credor',
      credor_copy_link:  'Copiar link',
      credor_edit:       'Editar credor',
      credor_delete:     'Excluir credor',
      credor_view:       'Ver detalhes',
      credor_total:      'Total devido',
      credor_paid:       'Pago',
      credor_balance:    'Saldo pendente',
      credor_empty:      'Nenhum credor cadastrado',
      credor_empty_sub:  'Adicione seu primeiro credor para começar',
      credor_delete_confirm: 'Tem certeza que deseja excluir este credor? Todos os débitos e pagamentos relacionados serão removidos.',

      // Debitos
      debitos_title:     'Débitos',
      debitos_subtitle:  'Todos os seus débitos registrados',
      debit_description: 'Descrição',
      debit_date:        'Data de emissão',
      debit_amount:      'Valor',
      debit_type:        'Tipo',
      debit_type_unique: 'Único',
      debit_type_installment: 'Parcelado',
      debit_type_recurring:   'Recorrente (mensal)',
      debit_installments: 'Número de parcelas',
      debit_installment_value: 'Valor por parcela',
      debit_creditor:    'Credor',
      debit_select_creditor: 'Selecione um credor',
      debit_status_active:  'Ativo',
      debit_status_paid:    'Pago',
      debit_status_partial: 'Parcial',
      debit_empty:       'Nenhum débito cadastrado',
      debit_empty_sub:   'Adicione um débito para começar a controlar',
      debit_edit:        'Editar débito',
      debit_delete:      'Excluir débito',
      debit_total:       'Valor total',
      debit_paid_amount: 'Valor pago',
      debit_remaining:   'Restante',

      // Pagamentos
      payments_title:    'Pagamentos',
      payments_subtitle: 'Histórico de pagamentos realizados',
      payment_debit:     'Débito',
      payment_select_debit: 'Selecione um débito',
      payment_amount:    'Valor pago',
      payment_date:      'Data do pagamento',
      payment_note:      'Observação (opcional)',
      payment_empty:     'Nenhum pagamento registrado',
      payment_empty_sub: 'Registre seu primeiro pagamento',

      // Modals
      modal_new_credor:   'Novo credor',
      modal_edit_credor:  'Editar credor',
      modal_new_debit:    'Novo débito',
      modal_edit_debit:   'Editar débito',
      modal_new_payment:  'Registrar pagamento',
      modal_confirm_delete: 'Confirmar exclusão',
      btn_save:   'Salvar',
      btn_cancel: 'Cancelar',
      btn_delete: 'Excluir',
      btn_confirm: 'Confirmar',
      btn_close:  'Fechar',

      // Settings
      settings_title:    'Configurações',
      settings_theme:    'Aparência',
      settings_theme_dark:  'Escuro',
      settings_theme_light: 'Claro',
      settings_language: 'Idioma',
      settings_currency: 'Moeda padrão',
      settings_account:  'Minha conta',
      settings_edit_name: 'Alterar nome',
      settings_change_password: 'Alterar senha',

      // Errors / Validation
      err_required:      'Campo obrigatório',
      err_email_invalid: 'E-mail inválido',
      err_passwords_match: 'As senhas não coincidem',
      err_security_code_wrong: 'Código de segurança incorreto',
      err_user_not_found: 'E-mail não encontrado',
      err_wrong_password: 'Senha incorreta',
      err_email_taken:   'Este e-mail já está cadastrado',
      err_password_min:  'Mínimo 6 caracteres',
      err_amount_invalid: 'Valor inválido',
      err_amount_positive: 'O valor deve ser positivo',

      // Toasts
      toast_login_success:    '👋 Bem-vindo de volta!',
      toast_register_success: '🎉 Conta criada com sucesso!',
      toast_credor_created:   '✅ Credor adicionado!',
      toast_credor_updated:   '✅ Credor atualizado!',
      toast_credor_deleted:   '🗑️ Credor removido.',
      toast_debit_created:    '✅ Débito registrado!',
      toast_debit_updated:    '✅ Débito atualizado!',
      toast_debit_deleted:    '🗑️ Débito removido.',
      toast_payment_created:  '💸 Pagamento registrado!',
      toast_copied:           '📋 Link copiado!',
      toast_password_changed: '🔐 Senha alterada!',
      toast_password_reset:   '🔐 Senha redefinida!',
      toast_profile_updated:  '✅ Perfil atualizado!',

      // Creditor public page
      pub_title:      'Extrato de Débitos',
      pub_subtitle:   'Veja o que está sendo devido a você',
      pub_total:      'Total em aberto',
      pub_paid:       'Total recebido',
      pub_this_month: 'Este mês',
      pub_active:     'Débitos ativos',
      pub_paid_items: 'Pagamentos recebidos',
      pub_future:     'A receber',
      pub_btn_extrato: '📋 Ver extrato completo',
      pub_btn_back:    '← Voltar',
      pub_no_debt:     'Nenhuma dívida registrada',
      pub_not_found:   'Credor não encontrado',
      pub_not_found_sub: 'O link que você acessou não existe ou foi removido.',
      pub_this_month_title: 'Débitos deste mês',
      pub_no_debt_month: 'Nenhum débito neste mês.',
      pub_paid_title:    'Débitos quitados',
      pub_full_statement: 'Extrato completo',
      label_open:         'em aberto',
      label_active_debits: 'débito(s) ativo(s)',
      label_payments:     'pagamento(s)',
      label_percent_paid: 'pago',
      label_total_received: 'Total recebido',
      opt_currency_brl: 'R$ Real',
      opt_currency_eur: '€ Euro',
      opt_currency_usd: '$ Dólar',
      opt_currency_gbp: '£ Libra',
      opt_currency_brl_full: '🇧🇷 Real (R$)',
      opt_currency_eur_full: '🇪🇺 Euro (€)',
      opt_currency_usd_full: '🇺🇸 Dólar ($)',
      opt_currency_gbp_full: '🇬🇧 Libra (£)',

      // Misc
      currency_label: 'Moeda',
      lang_label:     'Idioma',
      developed_by:   'Desenvolvido por',
      loading:        'Carregando...',
      all_credores:   'Todos os credores',
      month_names: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
      month_short: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
      installments_label: 'parcela',
      installments_of:    'de',
      recurring_label:    'Recorrente',
      unique_label:       'Único',
    },

    en: {
      brand_name:     'DebitHub',
      brand_tagline:  'Smart personal debt control',

      login_tab:      'Sign In',
      login_subtitle: 'Access your account',
      register_tab:   'Create Account',
      register_subtitle: 'New here? Sign up',
      field_name:     'Full name',
      field_email:    'Email',
      field_password: 'Password',
      field_confirm_password: 'Confirm password',
      field_security_code: 'Security code',
      btn_login:      'Sign in',
      btn_register:   'Create account',
      forgot_password: 'Forgot password',
      forgot_title:   'Reset password',
      forgot_desc:    'Enter your email and the security code you created during registration to reset your password.',
      field_new_password: 'New password',
      btn_reset:      'Reset password',
      back_login:     'Back to sign in',
      security_hint:  '🔐 Create an alphanumeric code (e.g. ABC123) for password recovery in case you forget it. Keep it in a safe place.',
      password_strength_1: 'Weak',
      password_strength_2: 'Fair',
      password_strength_3: 'Good',
      password_strength_4: 'Strong',
      change_password_title: 'Change password',
      field_current_password: 'Current password',
      btn_change_password: 'Change password',

      nav_overview:   'Overview',
      nav_credores:   'Creditors',
      nav_debitos:    'Debts',
      nav_payments:   'Payments',
      nav_settings:   'Settings',
      nav_logout:     'Sign out',
      nav_profile:    'My Profile',

      dash_title:     'Overview',
      dash_subtitle:  'Track your debts and payments',
      stat_total_debt:   'Total active debt',
      stat_total_paid:   'Total paid',
      stat_this_month:   'Due this month',
      stat_credores:     'Active creditors',
      filter_today:   'Today',
      filter_month:   'This month',
      filter_3m:      '3 months',
      filter_6m:      '6 months',
      filter_1y:      '1 year',
      filter_custom:  'Custom',
      filter_label:   'Period:',
      filter_from:    'From',
      filter_to:      'To',

      credores_title:    'Creditors',
      credores_subtitle: 'People you owe money to',
      btn_new_credor:    '+ New creditor',
      btn_new_debit:     '+ New debt',
      btn_new_payment:   '+ Register payment',
      credor_name:       'Creditor name',
      credor_city:       'City',
      credor_state:      'State',
      credor_phone:      'Phone',
      credor_link:       '🔗 Creditor link',
      credor_copy_link:  'Copy link',
      credor_edit:       'Edit creditor',
      credor_delete:     'Delete creditor',
      credor_view:       'View details',
      credor_total:      'Total owed',
      credor_paid:       'Paid',
      credor_balance:    'Pending balance',
      credor_empty:      'No creditors registered',
      credor_empty_sub:  'Add your first creditor to get started',
      credor_delete_confirm: 'Are you sure you want to delete this creditor? All related debts and payments will be removed.',

      debitos_title:     'Debts',
      debitos_subtitle:  'All your registered debts',
      debit_description: 'Description',
      debit_date:        'Issue date',
      debit_amount:      'Amount',
      debit_type:        'Type',
      debit_type_unique: 'One-time',
      debit_type_installment: 'Installments',
      debit_type_recurring:   'Recurring (monthly)',
      debit_installments: 'Number of installments',
      debit_installment_value: 'Amount per installment',
      debit_creditor:    'Creditor',
      debit_select_creditor: 'Select a creditor',
      debit_status_active:  'Active',
      debit_status_paid:    'Paid',
      debit_status_partial: 'Partial',
      debit_empty:       'No debts registered',
      debit_empty_sub:   'Add a debt to start tracking',
      debit_edit:        'Edit debt',
      debit_delete:      'Delete debt',
      debit_total:       'Total amount',
      debit_paid_amount: 'Amount paid',
      debit_remaining:   'Remaining',

      payments_title:    'Payments',
      payments_subtitle: 'History of payments made',
      payment_debit:     'Debt',
      payment_select_debit: 'Select a debt',
      payment_amount:    'Amount paid',
      payment_date:      'Payment date',
      payment_note:      'Note (optional)',
      payment_empty:     'No payments registered',
      payment_empty_sub: 'Register your first payment',

      modal_new_credor:   'New creditor',
      modal_edit_credor:  'Edit creditor',
      modal_new_debit:    'New debt',
      modal_edit_debit:   'Edit debt',
      modal_new_payment:  'Register payment',
      modal_confirm_delete: 'Confirm deletion',
      btn_save:   'Save',
      btn_cancel: 'Cancel',
      btn_delete: 'Delete',
      btn_confirm: 'Confirm',
      btn_close:  'Close',

      settings_title:    'Settings',
      settings_theme:    'Appearance',
      settings_theme_dark:  'Dark',
      settings_theme_light: 'Light',
      settings_language: 'Language',
      settings_currency: 'Default currency',
      settings_account:  'My account',
      settings_edit_name: 'Edit name',
      settings_change_password: 'Change password',

      err_required:      'Required field',
      err_email_invalid: 'Invalid email',
      err_passwords_match: 'Passwords do not match',
      err_security_code_wrong: 'Incorrect security code',
      err_user_not_found: 'Email not found',
      err_wrong_password: 'Incorrect password',
      err_email_taken:   'This email is already registered',
      err_password_min:  'Minimum 6 characters',
      err_amount_invalid: 'Invalid amount',
      err_amount_positive: 'Amount must be positive',

      toast_login_success:    '👋 Welcome back!',
      toast_register_success: '🎉 Account created successfully!',
      toast_credor_created:   '✅ Creditor added!',
      toast_credor_updated:   '✅ Creditor updated!',
      toast_credor_deleted:   '🗑️ Creditor removed.',
      toast_debit_created:    '✅ Debt registered!',
      toast_debit_updated:    '✅ Debt updated!',
      toast_debit_deleted:    '🗑️ Debt removed.',
      toast_payment_created:  '💸 Payment registered!',
      toast_copied:           '📋 Link copied!',
      toast_password_changed: '🔐 Password changed!',
      toast_password_reset:   '🔐 Password reset!',
      toast_profile_updated:  '✅ Profile updated!',

      pub_title:      'Debt Statement',
      pub_subtitle:   'See what is being owed to you',
      pub_total:      'Total outstanding',
      pub_paid:       'Total received',
      pub_this_month: 'This month',
      pub_active:     'Active debts',
      pub_paid_items: 'Payments received',
      pub_future:     'To receive',
      pub_btn_extrato: '📋 Full statement',
      pub_btn_back:    '← Back',
      pub_no_debt:     'No debts registered',
      pub_not_found:   'Creditor not found',
      pub_not_found_sub: 'The link you accessed does not exist or has been removed.',
      pub_this_month_title: 'This month\'s debts',
      pub_no_debt_month: 'No debts this month.',
      pub_paid_title:    'Settled debts',
      pub_full_statement: 'Full statement',
      label_open:         'open',
      label_active_debits: 'active debt(s)',
      label_payments:     'payment(s)',
      label_percent_paid: 'paid',
      label_total_received: 'Total received',
      opt_currency_brl: 'R$ Real',
      opt_currency_eur: '€ Euro',
      opt_currency_usd: '$ Dollar',
      opt_currency_gbp: '£ Pound',
      opt_currency_brl_full: '🇧🇷 Real (R$)',
      opt_currency_eur_full: '🇪🇺 Euro (€)',
      opt_currency_usd_full: '🇺🇸 Dollar ($)',
      opt_currency_gbp_full: '🇬🇧 Pound (£)',

      currency_label: 'Currency',
      lang_label:     'Language',
      developed_by:   'Developed by',
      loading:        'Loading...',
      all_credores:   'All creditors',
      month_names: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      month_short: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      installments_label: 'installment',
      installments_of:    'of',
      recurring_label:    'Recurring',
      unique_label:       'One-time',
    }
  };

  let currentLang = 'pt';

  function t(key) {
    const dict = translations[currentLang] || translations.pt;
    return dict[key] !== undefined ? dict[key] : (translations.pt[key] || key);
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    DH.state.language = lang;
    localStorage.setItem('dh_language', lang);
    applyTranslations();
    // Re-render dynamic content if dashboard is open
    if (typeof DH.dashboard !== 'undefined' && DH.dashboard.render) {
      DH.dashboard.render();
    }
  }

  function getLanguage() { return currentLang; }

  function applyTranslations() {
    // Apply [data-i18n] attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });
    // Update document title
    const titleEl = document.querySelector('title[data-i18n-title]');
    if (titleEl) {
      document.title = t(titleEl.getAttribute('data-i18n-title')) + ' — ' + t('brand_name');
    }
  }

  function init() {
    const saved = localStorage.getItem('dh_language') || 'pt';
    currentLang = saved;
    if (DH.state) DH.state.language = saved;
  }

  return { t, setLanguage, getLanguage, applyTranslations, init };
})();
