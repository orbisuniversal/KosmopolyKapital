export type Language = 'es' | 'en';

export const translations = {
  es: {
    FINANCE_OS: 'FINANCE OS',
    Dashboard: 'Centro de Mando',
    Finance: 'Finanzas',
    Journal: 'Diario de Inversiones',
    Social: 'Hub Social',
    Radar: 'Radar Macro',
    Academy: 'Mentor IA & Academia',
    Settings: 'Preferencias',
    Admin: 'Panel de Admin',
    
    // Finance Center
    TotalBalance: 'Balance Total',
    Accounts: 'Cuentas',
    MonthlyCashflow: 'Flujo Caja',
    Incomes: 'Ingresos',
    Expenses: 'Gastos',
    Savings: 'Ahorro',
    Manage: 'Gestionar',
    
    // Nav Labels
    Dashboard: 'Dashboard',
    AccountsNav: 'Cuentas',
    TransactionsNav: 'Presupuestos',
    GoalsNav: 'Metas',
    InvestmentsNav: 'Inversiones',
    CorporateNav: 'Empresa',
    AdvisorNav: 'Consejero',
    
    // Modals & Actions
    Save: 'Guardar',
    Cancel: 'Cancelar',
    Edit: 'Editar',
    Delete: 'Eliminar',
  },
  en: {
    FINANCE_OS: 'FINANCE OS',
    Dashboard: 'Dashboard',
    Finance: 'Finance',
    Journal: 'Investment Journal',
    Social: 'Social Hub',
    Radar: 'Macro Radar',
    Academy: 'AI Mentor & Academy',
    Settings: 'Settings',
    Admin: 'Admin Panel',
    
    // Finance Center
    TotalBalance: 'Total Balance',
    Accounts: 'Accounts',
    MonthlyCashflow: 'Cashflow',
    Incomes: 'Incomes',
    Expenses: 'Expenses',
    Savings: 'Savings',
    Manage: 'Manage',
    
    // Nav Labels
    Dashboard: 'Dashboard',
    AccountsNav: 'Accounts',
    TransactionsNav: 'Budgets',
    GoalsNav: 'Goals',
    InvestmentsNav: 'Investments',
    CorporateNav: 'Corporate',
    AdvisorNav: 'Advisor',
    
    // Modals & Actions
    Save: 'Save',
    Cancel: 'Cancel',
    Edit: 'Edit',
    Delete: 'Delete',
  }
};

export const t = (key: string, lang: Language): string => {
  return translations[lang][key as keyof typeof translations['es']] || key;
};
