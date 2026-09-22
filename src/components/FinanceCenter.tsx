import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { Language, t } from '../i18n';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Award, 
  Briefcase, 
  Calendar, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  BarChart3, 
  Target, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Sliders,
  Layers,
  HeartHandshake,
  Wallet,
  FileText,
  Percent,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  Edit2
} from 'lucide-react';
import { auth, db, cleanUndefined } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface FinanceCenterProps {
  trades: Trade[];
  theme: 'dark' | 'light';
  language: Language;
}

// Data structures
export interface Account {
  id: string;
  name: string;
  type: 'operating' | 'savings' | 'investment' | 'debt' | 'corporate' | 'pension';
  balance: number;
  description: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  accountId: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  status: 'active' | 'cancelled';
  renewalDate: string;
  frequency: 'monthly' | 'yearly';
  category: string;
  unusedDays?: number; 
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  category: 'Urgente' | 'Medio plazo' | 'Largo plazo';
}

export interface CorporateInvoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  date: string;
  status: 'PAGADA' | 'PENDIENTE' | 'EN MORA';
  taxes: number; 
}

export interface CorporateExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  deducibility: '100%' | '50%' | '0%';
}

// Default Data Seed for first-time use
const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc-1', name: 'Cuenta Corriente Personal', type: 'operating', balance: 0.00, description: 'Flujo diario, nómina, cobros rápidos' },
  { id: 'acc-2', name: 'Fondo de Emergencia Reservado', type: 'savings', balance: 0.00, description: 'Ahorro intocable de seguridad' },
  { id: 'acc-3', name: 'Broker de Inversión', type: 'investment', balance: 0.00, description: 'Lote de acumulación bursátil estructurada' },
  { id: 'acc-4', name: 'Crédito Hipotecario Inmueble', type: 'debt', balance: 0.00, description: 'Hipotecas vivas con tipo fijo' },
  { id: 'acc-5', name: 'Fondo Corporativo (S.L.)', type: 'corporate', balance: 0.00, description: 'Operaciones de consultoría y tesorería' },
  { id: 'acc-6', name: 'Plan de Pensiones Indexado', type: 'pension', balance: 0.00, description: 'Jubilación con baja fiscalidad activa' }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [];

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [];

const DEFAULT_GOALS: Goal[] = [];

const DEFAULT_INVOICES: CorporateInvoice[] = [];

const DEFAULT_CORP_EXPENSES: CorporateExpense[] = [];

export default function FinanceCenter({ trades, theme, language }: FinanceCenterProps) {
  // Tabs for the 7 Pillars
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'account_detail' | 'goals' | 'investments' | 'advisor'>('dashboard');
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  // Sub-data states
  const [accounts, setAccounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(DEFAULT_SUBSCRIPTIONS);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [invoices, setInvoices] = useState<CorporateInvoice[]>(DEFAULT_INVOICES);
  const [corpExpenses, setCorpExpenses] = useState<CorporateExpense[]>(DEFAULT_CORP_EXPENSES);

  // Syncing and loading state
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // New item forms
  const [accountForm, setAccountForm] = useState({ name: '', type: 'operating', balance: 0, description: '' });
  const [transactionForm, setTransactionForm] = useState({ type: 'expense', category: 'Necesidades fijas (~50%)', amount: '', description: '', accountId: 'acc-1', date: new Date().toISOString().split('T')[0] });
  const [goalForm, setGoalForm] = useState({ name: '', target: '', saved: '', deadline: '2027-12-31', category: 'Urgente' });
  const [invoiceForm, setInvoiceForm] = useState({ client: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'PENDIENTE' });
  const [corpExpenseForm, setCorpExpenseForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], deducibility: '100%' });
  const [subForm, setSubForm] = useState({ name: '', amount: '', renewalDate: new Date().toISOString().split('T')[0], category: 'Estilo de vida' });

  // Editing states
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<CorporateInvoice | null>(null);
  const [editingCorpExpense, setEditingCorpExpense] = useState<CorporateExpense | null>(null);

  // Salary bridge form
  const [salaryAmount, setSalaryAmount] = useState('2000');

  // 1. Initial Load & Listen
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const currentUser = auth.currentUser;

    if (currentUser) {
      setIsLoading(true);
      const docRef = doc(db, 'finance_center_data', currentUser.uid);

      unsubscribe = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.accounts) setAccounts(data.accounts);
          if (data.transactions) setTransactions(data.transactions);
          if (data.subscriptions) setSubscriptions(data.subscriptions);
          if (data.goals) setGoals(data.goals);
          if (data.invoices) setInvoices(data.invoices);
          if (data.corpExpenses) setCorpExpenses(data.corpExpenses);
          setSyncStatus('synced');
        } else {
          // Initialize in Firestore with Default data and update state
          const initialPayload = {
            accounts: DEFAULT_ACCOUNTS,
            transactions: DEFAULT_TRANSACTIONS,
            subscriptions: DEFAULT_SUBSCRIPTIONS,
            goals: DEFAULT_GOALS,
            invoices: DEFAULT_INVOICES,
            corpExpenses: DEFAULT_CORP_EXPENSES,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          setDoc(docRef, initialPayload)
            .then(() => console.log("[FINANCE] Initialized default metrics in firestore"))
            .catch(err => console.error("[FINANCE] Error initializing default metrics in firestore:", err));
        }
        setIsLoading(false);
      }, (error) => {
        console.warn("[FINANCE] Failed firebase stream hook, fallback to offline local state:", error.message);
        loadFromLocalStorage();
        setIsLoading(false);
        setSyncStatus('offline');
      });
    } else {
      loadFromLocalStorage();
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const loadFromLocalStorage = () => {
    const local = localStorage.getItem('KK_FINANCE_CENTER_DATA');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.subscriptions) setSubscriptions(parsed.subscriptions);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.corpExpenses) setCorpExpenses(parsed.corpExpenses);
        setSyncStatus('offline');
      } catch (e) {
        // use default seed
      }
    }
  };

  // Helper to trigger save/sync
  const saveFinanceState = async (
    upCuentas: Account[], 
    upTx: Transaction[], 
    upSubs: Subscription[], 
    upGoals: Goal[], 
    upInvoices: CorporateInvoice[], 
    upExpenses: CorporateExpense[]
  ) => {
    setSyncStatus('saving');
    // Local copy
    const payload = {
      accounts: upCuentas,
      transactions: upTx,
      subscriptions: upSubs,
      goals: upGoals,
      invoices: upInvoices,
      corpExpenses: upExpenses,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('KK_FINANCE_CENTER_DATA', JSON.stringify(payload));

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'finance_center_data', currentUser.uid);
        await setDoc(docRef, cleanUndefined(payload), { merge: true });
        setSyncStatus('synced');
      } catch (err: any) {
        console.error("Firestore finance center save failed: ", err);
        setSyncStatus('offline');
      }
    } else {
      setSyncStatus('offline');
    }
  };

  // 2. Calculations based on Investment trades & other variables
  const tradesPnL = trades.reduce((acc, t) => acc + t.pnl, 0);

  // Link Investment Account: We add the live trades PnL onto "Broker de Inversión" (acc-3)
  const getLinkedAccounts = (): Account[] => {
    return accounts.map(acc => {
      if (acc.id === 'acc-3') {
        return {
          ...acc,
          balance: acc.balance + tradesPnL
        };
      }
      return acc;
    });
  };

  const currentLinkedAccounts = getLinkedAccounts();

  // Patrimonio Neto = Activos - Pasivos
  const totalAssets = currentLinkedAccounts.filter(a => a.balance > 0).reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = Math.abs(currentLinkedAccounts.filter(a => a.balance < 0).reduce((acc, a) => acc + a.balance, 0));
  const netWorth = totalAssets - totalLiabilities;

  // Liquidez Disponible = Cuentas Corrientes
  const cashAvailable = currentLinkedAccounts
    .filter(a => a.type === 'operating')
    .reduce((acc, a) => acc + a.balance, 0);

  // Flow of the Month: Inputs vs Outputs
  const monthlyIncomes = transactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyNetFlow = monthlyIncomes - monthlyExpenses;

  // Budget Category Usage vs recommendation (50/30/20)
  const expensesByCategory = {
    fijo: transactions.filter(tx => tx.type === 'expense' && tx.category.includes('Necesidades fijas')).reduce((acc, tx) => acc + tx.amount, 0),
    variable: transactions.filter(tx => tx.type === 'expense' && tx.category.includes('Estilo de vida')).reduce((acc, tx) => acc + tx.amount, 0),
    ahorro: transactions.filter(tx => tx.type === 'expense' && tx.category.includes('Ahorro')).reduce((acc, tx) => acc + tx.amount, 0)
  };

  const totalMonthlySpent = expensesByCategory.fijo + expensesByCategory.variable + expensesByCategory.ahorro;

  // Active Subscriptions
  const monthlySubscriptionSpent = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, s) => acc + s.amount, 0);

  // 3. Methods to manipulate state
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name || accountForm.balance === undefined) return;
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: accountForm.name,
      type: accountForm.type as any,
      balance: Number(accountForm.balance),
      description: accountForm.description || 'Cuenta de propósito general'
    };
    const nextAccs = [...accounts, newAcc];
    setAccounts(nextAccs);
    setAccountForm({ name: '', type: 'operating', balance: 0, description: '' });
    saveFinanceState(nextAccs, transactions, subscriptions, goals, invoices, corpExpenses);
  };

  const handleDeleteAccount = (id: string) => {
    if (id === 'acc-1' || id === 'acc-3' || id === 'acc-5') return; // protect key accounts
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next);
    saveFinanceState(next, transactions, subscriptions, goals, invoices, corpExpenses);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.description || !transactionForm.amount) return;
    const amountVal = Number(transactionForm.amount);
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: transactionForm.type as any,
      category: transactionForm.category,
      amount: amountVal,
      description: transactionForm.description,
      date: transactionForm.date,
      accountId: transactionForm.accountId
    };

    // Update account balance
    const updatedAccounts = accounts.map(a => {
      if (a.id === transactionForm.accountId) {
        return {
          ...a,
          balance: transactionForm.type === 'income' ? a.balance + amountVal : a.balance - amountVal
        };
      }
      return a;
    });

    const nextTx = [newTx, ...transactions];
    setAccounts(updatedAccounts);
    setTransactions(nextTx);
    setTransactionForm({
      ...transactionForm,
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    saveFinanceState(updatedAccounts, nextTx, subscriptions, goals, invoices, corpExpenses);
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    // Revert balance impact on account
    const restoredAccs = accounts.map(a => {
      if (a.id === tx.accountId) {
        return {
          ...a,
          balance: tx.type === 'income' ? a.balance - tx.amount : a.balance + tx.amount
        };
      }
      return a;
    });

    const nextTx = transactions.filter(t => t.id !== tx.id);
    setAccounts(restoredAccs);
    setTransactions(nextTx);
    saveFinanceState(restoredAccs, nextTx, subscriptions, goals, invoices, corpExpenses);
  };

  // Cancel/activate subscription (Rocket Money style)
  const toggleSubscriptionStatus = (id: string) => {
    const updated = subscriptions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === 'active' ? 'cancelled' as const : 'active' as const
        };
      }
      return s;
    });
    setSubscriptions(updated);
    saveFinanceState(accounts, transactions, updated, goals, invoices, corpExpenses);
  };

  // Add subscription
  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name || !subForm.amount) return;
    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      name: subForm.name,
      amount: Number(subForm.amount),
      status: 'active',
      renewalDate: subForm.renewalDate,
      frequency: 'monthly',
      category: subForm.category
    };
    const nextSubs = [...subscriptions, newSub];
    setSubscriptions(nextSubs);
    setSubForm({ name: '', amount: '', renewalDate: new Date().toISOString().split('T')[0], category: 'Estilo de vida' });
    saveFinanceState(accounts, transactions, nextSubs, goals, invoices, corpExpenses);
  };

  // Add goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.target) return;
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: goalForm.name,
      target: Number(goalForm.target),
      saved: Number(goalForm.saved) || 0,
      deadline: goalForm.deadline,
      category: goalForm.category as any
    };
    const nextGoals = [...goals, newGoal];
    setGoals(nextGoals);
    setGoalForm({ name: '', target: '', saved: '', deadline: '2027-12-31', category: 'Urgente' });
    saveFinanceState(accounts, transactions, subscriptions, nextGoals, invoices, corpExpenses);
  };

  // Contribute/Move money of account into a SMART Goal
  const handleContributeToGoal = (goalId: string, amountToSave: number) => {
    if (amountToSave <= 0) return;
    const hasSufficient = accounts.some(a => a.id === 'acc-1' && a.balance >= amountToSave);
    if (!hasSufficient) {
      alert("Fondos insuficientes en Cuenta Corriente para realizar este aporte fiscalizado.");
      return;
    }

    // Move money from Account 1 to Savings Goal
    const updatedAccs = accounts.map(a => {
      if (a.id === 'acc-1') return { ...a, balance: a.balance - amountToSave };
      if (a.id === 'acc-2') return { ...a, balance: a.balance + amountToSave }; // emergencias/ahorros fijos
      return a;
    });

    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          saved: g.saved + amountToSave
        };
      }
      return g;
    });

    // Automatically record a transfer transaction (expense on operational, but designated to Ahorro)
    const newTx: Transaction = {
      id: `tx-goal-${Date.now()}`,
      type: 'expense',
      category: 'Ahorro e inversión (~20%)',
      amount: amountToSave,
      description: `Aporte a meta: ${goals.find(x => x.id === goalId)?.name}`,
      date: new Date().toISOString().split('T')[0],
      accountId: 'acc-1'
    };

    const nextTx = [newTx, ...transactions];

    setAccounts(updatedAccs);
    setGoals(updatedGoals);
    setTransactions(nextTx);
    saveFinanceState(updatedAccs, nextTx, subscriptions, updatedGoals, invoices, corpExpenses);
  };

  // Módulo Empresa: Emitir factura
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.client || !invoiceForm.amount) return;
    const amountVal = Number(invoiceForm.amount);
    const invoiceNum = `F-2026-00${invoices.length + 42}`;
    const newInv: CorporateInvoice = {
      id: `cinv-${Date.now()}`,
      number: invoiceNum,
      client: invoiceForm.client,
      amount: amountVal,
      date: invoiceForm.date,
      status: invoiceForm.status as any,
      taxes: Math.round(amountVal * 0.21) // 21% IVA standard
    };

    // If status is PAGADA, add amount directly to business operational account acc-5
    let updatedAccs = [...accounts];
    if (invoiceForm.status === 'PAGADA') {
      updatedAccs = accounts.map(a => {
        if (a.id === 'acc-5') return { ...a, balance: a.balance + amountVal + (amountVal * 0.21) };
        return a;
      });
    }

    const next = [...invoices, newInv];
    setInvoices(next);
    setAccounts(updatedAccs);
    setInvoiceForm({ client: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'PENDIENTE' });
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, next, corpExpenses);
  };

  // Toggle invoice paid
  const toggleInvoicePaid = (id: string) => {
    let updatedAccs = [...accounts];
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === id) {
        const nextStatus = inv.status === 'PAGADA' ? 'PENDIENTE' as const : 'PAGADA' as const;
        // Adjust capital
        updatedAccs = accounts.map(a => {
          if (a.id === 'acc-5') {
            const delta = nextStatus === 'PAGADA' ? (inv.amount + inv.taxes) : -(inv.amount + inv.taxes);
            return { ...a, balance: a.balance + delta };
          }
          return a;
        });
        return { ...inv, status: nextStatus };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setAccounts(updatedAccs);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, updatedInvoices, corpExpenses);
  };

  // Módulo Empresa: Registrar Gasto corporativo
  const handleAddCorpExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corpExpenseForm.description || !corpExpenseForm.amount) return;
    const expVal = Number(corpExpenseForm.amount);
    const newExp: CorporateExpense = {
      id: `cexp-${Date.now()}`,
      description: corpExpenseForm.description,
      amount: expVal,
      date: corpExpenseForm.date,
      deducibility: corpExpenseForm.deducibility as any
    };

    // Deduct from business account acc-5
    const updatedAccs = accounts.map(a => {
      if (a.id === 'acc-5') return { ...a, balance: a.balance - expVal };
      return a;
    });

    const next = [...corpExpenses, newExp];
    setCorpExpenses(next);
    setAccounts(updatedAccs);
    setCorpExpenseForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], deducibility: '100%' });
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, invoices, next);
  };

  // Eliminate corporate transaction record
  const handleDeleteCorpExpense = (id: string, amount: number) => {
    const updatedAccs = accounts.map(a => {
      if (a.id === 'acc-5') return { ...a, balance: a.balance + amount };
      return a;
    });
    const next = corpExpenses.filter(e => e.id !== id);
    setCorpExpenses(next);
    setAccounts(updatedAccs);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, invoices, next);
  };

  // AUTOMATED BRIDGE: Empresa -> Personal (Pagar nómina / retirar dividendos)
  const handleExecuteSalaryBridge = () => {
    const transferVal = Number(salaryAmount);
    if (!transferVal || transferVal <= 0) return;

    // Check if Corporate Account (acc-5) has enough liquidity
    const corpAccount = accounts.find(a => a.id === 'acc-5');
    if (!corpAccount || corpAccount.balance < transferVal) {
      alert("La tesorería corporativa de KK Empresa no tiene liquidez suficiente para emitir este salario hoy.");
      return;
    }

    // Perform transaction
    const updatedAccs = accounts.map(a => {
      if (a.id === 'acc-5') {
        // Business operational account gets deducted
        return { ...a, balance: a.balance - transferVal };
      }
      if (a.id === 'acc-1') {
        // Personal operative account gains salary
        return { ...a, balance: a.balance + transferVal };
      }
      return a;
    });

    // Log the transaction in the Personal log! (Pilar 3)
    const newTx: Transaction = {
      id: `tx-bridge-${Date.now()}`,
      type: 'income',
      category: 'Ingresos Recurrentes (Nómina)',
      amount: transferVal,
      description: 'Transferencia Salario / Retiro fiscal de Empresa S.L.',
      date: new Date().toISOString().split('T')[0],
      accountId: 'acc-1'
    };

    const nextTx = [newTx, ...transactions];

    setAccounts(updatedAccs);
    setTransactions(nextTx);
    alert(`¡Salario de $${transferVal} transferido con éxito! Tesorería de empresa saldada. Se ha registrado el ingreso correspondiente en tus finanzas personales.`);
    saveFinanceState(updatedAccs, nextTx, subscriptions, goals, invoices, corpExpenses);
  };

  // DELETE & UPDATE HANDLERS
  const handleDeleteSubscription = (id: string) => {
    const nextSubs = subscriptions.filter(s => s.id !== id);
    setSubscriptions(nextSubs);
    saveFinanceState(accounts, transactions, nextSubs, goals, invoices, corpExpenses);
  };

  const handleDeleteGoal = (id: string) => {
    const nextGoals = goals.filter(g => g.id !== id);
    setGoals(nextGoals);
    saveFinanceState(accounts, transactions, subscriptions, nextGoals, invoices, corpExpenses);
  };

  const handleDeleteInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    let updatedAccs = [...accounts];
    if (invoice && invoice.status === 'PAGADA') {
      // Revert company balance impact
      const amountVal = invoice.amount;
      updatedAccs = accounts.map(a => {
        if (a.id === 'acc-5') return { ...a, balance: a.balance - amountVal - (amountVal * 0.21) };
        return a;
      });
      setAccounts(updatedAccs);
    }
    const nextInvoices = invoices.filter(i => i.id !== id);
    setInvoices(nextInvoices);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, nextInvoices, corpExpenses);
  };

  const handleEditAccountBalance = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;
    setEditingAccount(account);
  };

  // EDIT SAVE HANDLERS
  const handleSaveEditedAccount = (updated: Account) => {
    const updatedAccs = accounts.map(a => a.id === updated.id ? updated : a);
    setAccounts(updatedAccs);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, invoices, corpExpenses);
    setEditingAccount(null);
  };

  const handleSaveEditedSubscription = (updated: Subscription) => {
    const nextSubs = subscriptions.map(s => s.id === updated.id ? updated : s);
    setSubscriptions(nextSubs);
    saveFinanceState(accounts, transactions, nextSubs, goals, invoices, corpExpenses);
    setEditingSubscription(null);
  };

  const handleSaveEditedGoal = (updated: Goal) => {
    const nextGoals = goals.map(g => g.id === updated.id ? updated : g);
    setGoals(nextGoals);
    saveFinanceState(accounts, transactions, subscriptions, nextGoals, invoices, corpExpenses);
    setEditingGoal(null);
  };

  const handleSaveEditedTransaction = (updated: Transaction, original: Transaction) => {
    // 1. Revert original impact on original account
    let tempAccs = accounts.map(a => {
      if (a.id === original.accountId) {
        return {
          ...a,
          balance: original.type === 'income' ? a.balance - original.amount : a.balance + original.amount
        };
      }
      return a;
    });

    // 2. Apply new impact on new or same account
    const finalAccs = tempAccs.map(a => {
      if (a.id === updated.accountId) {
        return {
          ...a,
          balance: updated.type === 'income' ? a.balance + updated.amount : a.balance - updated.amount
        };
      }
      return a;
    });

    const nextTx = transactions.map(t => t.id === updated.id ? updated : t);
    setAccounts(finalAccs);
    setTransactions(nextTx);
    saveFinanceState(finalAccs, nextTx, subscriptions, goals, invoices, corpExpenses);
    setEditingTransaction(null);
  };

  const handleSaveEditedInvoice = (updated: CorporateInvoice, original: CorporateInvoice) => {
    let updatedAccs = [...accounts];
    
    if (original.status === 'PAGADA') {
      const originalTotal = original.amount + original.taxes;
      updatedAccs = updatedAccs.map(a => {
        if (a.id === 'acc-5') return { ...a, balance: a.balance - originalTotal };
        return a;
      });
    }

    if (updated.status === 'PAGADA') {
      const updatedTotal = updated.amount + updated.taxes;
      updatedAccs = updatedAccs.map(a => {
        if (a.id === 'acc-5') return { ...a, balance: a.balance + updatedTotal };
        return a;
      });
    }

    const nextInvoices = invoices.map(i => i.id === updated.id ? updated : i);
    setAccounts(updatedAccs);
    setInvoices(nextInvoices);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, nextInvoices, corpExpenses);
    setEditingInvoice(null);
  };

  const handleSaveEditedCorpExpense = (updated: CorporateExpense, original: CorporateExpense) => {
    let updatedAccs = accounts.map(a => {
      if (a.id === 'acc-5') return { ...a, balance: a.balance + original.amount };
      return a;
    });

    updatedAccs = updatedAccs.map(a => {
      if (a.id === 'acc-5') return { ...a, balance: a.balance - updated.amount };
      return a;
    });

    const nextExpenses = corpExpenses.map(e => e.id === updated.id ? updated : e);
    setAccounts(updatedAccs);
    setCorpExpenses(nextExpenses);
    saveFinanceState(updatedAccs, transactions, subscriptions, goals, invoices, nextExpenses);
    setEditingCorpExpense(null);
  };

  const handleResetFinanceData = async () => {
    if (!confirm("¿De verdad quieres ELIMINAR todos los datos de prueba y reiniciar tus finanzas a cero? Esta acción borrará todas las transacciones, metas, facturas y deudas, restableciendo tus balances a $0.00.")) {
      return;
    }
    // Set everything back to zeroed seeds
    const freshAccounts = DEFAULT_ACCOUNTS.map(a => ({ ...a, balance: 0 }));
    setAccounts(freshAccounts);
    setTransactions([]);
    setSubscriptions([]);
    setGoals([]);
    setInvoices([]);
    setCorpExpenses([]);
    await saveFinanceState(freshAccounts, [], [], [], [], []);
    alert("¡Bóveda financiera limpiada con éxito! Has comenzado con un balance limpio de $0 (sin datos simulados).");
  };

  // Calculating tax provisions for company
  const companyInvoiced = invoices.filter(i => i.status === 'PAGADA').reduce((acc, i) => acc + i.amount, 0);
  const companyExpenseDeducted = corpExpenses.reduce((acc, e) => {
    const factor = e.deducibility === '100%' ? 1 : e.deducibility === '50%' ? 0.5 : 0;
    return acc + (e.amount * factor);
  }, 0);
  const companyNetResult = companyInvoiced - companyExpenseDeducted;
  const estimatedIVA = invoices.filter(i => i.status === 'PAGADA').reduce((acc, i) => acc + i.taxes, 0);
  const estimatedIRPF = Math.max(0, Math.round(companyNetResult * 0.20)); // Base 20% provision standard

  // Advisor Ratios calculating logic
  const savingRate = monthlyIncomes > 0 ? (monthlyExpenses === 0 ? 100 : (monthlyNetFlow / monthlyIncomes) * 100) : 0;
  const monthlyFixCosts = transactions.filter(t => t.type === 'expense' && t.category.includes('Necesidades fijas')).reduce((acc, t) => acc + t.amount, 0);
  const monthlyVariableCosts = transactions.filter(t => t.type === 'expense' && t.category.includes('Estilo de vida')).reduce((acc, t) => acc + t.amount, 0);
  const averageMonthlyCost = monthlyFixCosts + monthlyVariableCosts || 1500; // fallback default estimate
  const emergencyFund = currentLinkedAccounts.find(a => a.id === 'acc-2')?.balance || 0;
  const emergencyCoverageMonths = averageMonthlyCost > 0 ? (emergencyFund / averageMonthlyCost) : 0;
  
  const debtServiceCost = 450; // simulated constant monthly mortgage payout representing debt service
  const debtToIncomeRatio = monthlyIncomes > 0 ? (debtServiceCost / monthlyIncomes) * 100 : 0;

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-black/10 rounded-2xl border border-white/5 space-y-4">
        <RefreshCw className="w-8 h-8 text-gold-accent animate-spin mx-auto" />
        <p className="text-xs uppercase font-mono tracking-widest text-txt-muted animate-pulse">Sincronizando la bóveda financiera...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR AND GLOBAL WEALTH VISUALIZER */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${
        theme === 'dark' ? 'neumorph-card-dark bg-gradient-to-r from-neutral-950 via-[#0C0E14] to-neutral-950 border-white/5' : 'neumorph-card-light bg-gradient-to-r from-neutral-50 via-white to-neutral-50 border-neutral-200'
      }`}>
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-success/15 text-success border border-success/20' : 
              syncStatus === 'saving' ? 'bg-warning/15 text-warning border border-warning/20 animate-pulse' : 
              'bg-danger/15 text-danger border border-danger/20'
            }`}>
              {syncStatus === 'synced' ? '● Bóveda Sincronizada (Cloud)' : 
               syncStatus === 'saving' ? '⟳ Guardando Cambios...' : 
               '⚠ Operando Localmente'}
            </span>
            <span className="text-[9px] font-mono font-medium text-txt-muted">FINANCE OS</span>
          </div>
          <h2 className="text-2xl font-display font-black text-txt-primary uppercase tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-gold-accent" /> Finanzas
          </h2>
          <div className="pt-2">
            <button 
              onClick={handleResetFinanceData}
              className="px-3 py-1 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 text-[9px] font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              🗑 Reiniciar Bóveda
            </button>
          </div>
        </div>

        {/* Global Stats Counter */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-l border-white/5 md:pl-8">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-txt-muted uppercase block">Patrimonio Neto Total</span>
            <span className={`text-xl md:text-2xl font-display font-black tracking-tight ${netWorth >= 0 ? 'text-gold-accent' : 'text-danger'}`}>
              ${netWorth.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-txt-muted uppercase block">Activos - Pasivos</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-txt-muted uppercase block">Liquidez Inmediata</span>
            <span className="text-xl md:text-2xl font-display font-black text-txt-primary tracking-tight">
              ${cashAvailable.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-txt-muted uppercase block">Fondo Corriente</span>
          </div>
          <div className="space-y-1 col-span-2 md:col-span-1">
            <span className="text-[9px] font-mono font-bold text-txt-muted uppercase block">Flujo de Caja del Mes</span>
            <span className={`text-xl md:text-2xl font-display font-black tracking-tight ${monthlyNetFlow >= 0 ? 'text-success' : 'text-danger'}`}>
              ${monthlyNetFlow >= 0 ? '+' : ''}{monthlyNetFlow.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-mono text-txt-muted uppercase block">Ingresos vs Gastos</span>
          </div>
        </div>
      </div>

      {/* 7-PILLARS TAB NAVIGATION BAR */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-gold-accent text-black border-gold-accent'
              : (theme === 'dark' ? 'bg-[#0E1117] hover:bg-neutral-900 text-txt-secondary border-white/5' : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm')
          }`}
        >
          <BarChart3 className="w-4 h-4" /> {t('DashboardNav', language)}
        </button>
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
            activeTab === 'accounts'
              ? 'bg-gold-accent text-black border-gold-accent'
              : (theme === 'dark' ? 'bg-[#0E1117] hover:bg-neutral-900 text-txt-secondary border-white/5' : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm')
          }`}
        >
          <Layers className="w-4 h-4" /> 🏦 {t('AccountsNav', language)}
        </button>
        <button 
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
            activeTab === 'goals'
              ? 'bg-gold-accent text-black border-gold-accent'
              : (theme === 'dark' ? 'bg-[#0E1117] hover:bg-neutral-900 text-txt-secondary border-white/5' : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm')
          }`}
        >
          <Target className="w-4 h-4" /> 🎯 {t('GoalsNav', language)}
        </button>
        <button 
          onClick={() => setActiveTab('investments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
            activeTab === 'investments'
              ? 'bg-gold-accent text-black border-gold-accent'
              : (theme === 'dark' ? 'bg-[#0E1117] hover:bg-neutral-900 text-txt-secondary border-white/5' : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm')
          }`}
        >
          <Activity className="w-4 h-4" /> 📈 {t('InvestmentsNav', language)}
        </button>
        <button 
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
            activeTab === 'advisor'
              ? 'bg-gold-accent text-black border-gold-accent'
              : (theme === 'dark' ? 'bg-[#0E1117] hover:bg-neutral-900 text-txt-secondary border-white/5' : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm')
          }`}
        >
          <Heart className="w-4 h-4" /> 💡 {t('AdvisorNav', language)}
        </button>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}

      {/* 1. DASHBOARD TAB VIEW */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main left bento section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Flow Meter and recommendations with traffic lights */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2">
                Caja
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl text-center ${theme === 'dark' ? 'bg-neutral-900/60' : 'bg-neutral-50 border border-neutral-100'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono font-bold block">{t('Incomes', language)}</span>
                  <span className="text-xl font-display font-black text-success">+${monthlyIncomes.toLocaleString('es-ES')}</span>
                </div>
                <div className={`p-4 rounded-xl text-center ${theme === 'dark' ? 'bg-neutral-900/60' : 'bg-neutral-50 border border-neutral-100'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono font-bold block">{t('Expenses', language)}</span>
                  <span className="text-xl font-display font-black text-danger">-${monthlyExpenses.toLocaleString('es-ES')}</span>
                </div>
                <div className={`p-4 rounded-xl text-center flex flex-col justify-center items-center ${monthlyNetFlow >= 0 ? 'bg-success/5 border border-success/20' : 'bg-danger/5 border border-danger/20'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono font-bold block">{t('Savings', language)}</span>
                  <span className={`text-xl font-display font-black ${monthlyNetFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${monthlyNetFlow.toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick overview of Accounts layout */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest">
                  Mapa de Cuentas
                </h3>
                <button onClick={() => setActiveTab('accounts')} className="text-[10px] uppercase font-mono text-gold-accent font-bold hover:underline flex items-center gap-1">
                  Gestionar <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentLinkedAccounts.map(acc => (
                  <div key={acc.id} onClick={() => { setActiveAccount(acc); setActiveTab('account_detail'); }} className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                    acc.balance < 0 ? 'bg-danger/5 border-danger/10' : (theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-50 border-neutral-100')
                  }`}>
                    <div className="space-y-0.5 max-w-[65%]">
                      <span className="text-[11px] font-display font-bold text-txt-primary block truncate">{acc.name}</span>
                      <span className="text-[9px] text-txt-muted uppercase font-mono block truncate">{acc.description}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[13px] font-mono font-black ${
                        acc.balance >= 0 ? (acc.id === 'acc-3' ? 'text-gold-accent' : 'text-txt-primary') : 'text-danger'
                      }`}>
                        ${acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 1 })}
                      </span>
                      <span className="text-[8px] text-txt-muted font-mono block uppercase">{acc.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inversión + Macro Link */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-gold-accent animate-pulse" /> Inversión
                </h3>
                <span className="text-[9px] text-txt-muted font-mono uppercase">Estructura Real-Time</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-neutral-900/20 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                  <span className="text-[10px] text-txt-muted font-mono uppercase font-bold block">Valor Líquido del Portfolio</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-display font-black text-gold-accent">
                      ${(accounts.find(a => a.id === 'acc-3')?.balance || 0 + tradesPnL).toLocaleString('es-ES')}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${tradesPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                      ({tradesPnL >= 0 ? '+' : ''}${tradesPnL.toLocaleString('es-ES')} Latente)
                    </span>
                  </div>
                  <p className="text-[9px] text-txt-muted font-sans mt-0.5">Indexado de forma dinámica con el Diario de Inversiones</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-txt-muted font-mono uppercase font-bold block">Resumen Operativo Reciente</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-black/10 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[8px] text-txt-muted uppercase font-mono block">Operaciones</span>
                      <span className="font-mono font-bold text-txt-primary">{trades.length}</span>
                    </div>
                    <div className="bg-black/10 p-2.5 rounded-lg border border-white/5">
                      <span className="text-[8px] text-txt-muted uppercase font-mono block">Rentabilidad</span>
                      <span className={`font-mono font-bold ${tradesPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                        {trades.length > 0 ? `${((tradesPnL / 15000) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('investments')}
                    className="w-full py-1.5 bg-gold-accent/10 border border-gold-accent/20 text-gold-accent text-[9px] uppercase tracking-wider font-mono font-black rounded hover:bg-gold-accent/20 transition-all cursor-pointer"
                  >
                    Abrir Monitor de Inversión vinculada
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Right sidebar: Consejero (Pilar 7) & ACTIVE ALERTS */}
          <div className="space-y-6">
            
            {/* Pilar 7: Alertas Inteligentes del Consejero */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-black uppercase text-gold-accent tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4 text-gold-accent animate-pulse" /> Alertas
              </h3>

              <div className="space-y-3.5">
                
                {/* Rule: Restaurant expenses */}
                {monthlyExpenses > 0 && expensesByCategory.variable > 150 ? (
                  <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl space-y-1 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-txt-primary uppercase block font-mono text-[9px] text-warning">Ajuste de Margen</span>
                      Tus gastos recreativos en restaurantes este mes representan un excedente. Esto está reduciendo el potencial de tus aportes de ahorro recurrente a las metas.
                    </div>
                  </div>
                ) : null}

                {/* Rule: Emergency Fund cobertura */}
                {emergencyCoverageMonths < 6 ? (
                  <div className="p-3 bg-danger/5 border border-danger/20 rounded-xl space-y-1 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-txt-primary uppercase block font-mono text-[9px] text-danger">Fondo de Emergencia Bajo</span>
                      Tu fondo líquido cubre únicamente <b className="font-mono text-danger">{emergencyCoverageMonths.toFixed(1)} meses</b> de gastos promedio. Te sugerimos elevarlo a la meta institucional de 6 meses hoy.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-success/5 border border-success/20 rounded-xl space-y-1 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-txt-primary uppercase block font-mono text-[9px] text-success">Colchón Robusto</span>
                      Tu fondo cubre un excelente periodo de {emergencyCoverageMonths.toFixed(1)} meses de gastos. Tu solvencia está validada contra latigazos externos.
                    </div>
                  </div>
                )}

                {/* Rule: Forgotten Subscription (Rocket Money) */}
                {subscriptions.some(s => s.status === 'active' && s.unusedDays && s.unusedDays > 60) ? (
                  <div className="p-3 bg-warning/5 border border-warning/20 rounded-xl space-y-1 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-txt-primary uppercase block font-mono text-[9px] text-warning">Gastos Fantasma Encontrados</span>
                      Detectamos que tienes la suscripción <b className="text-gold-accent">"{subscriptions.find(s => s.unusedDays && s.unusedDays > 60)?.name}"</b> activa sin registrar uso real en los últimos 60 días. Recomendamos su purga inmediata.
                    </div>
                  </div>
                ) : null}

                {/* Rule: Financial Health Ratios */}
                <div className="p-3 bg-black/10 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] text-txt-muted uppercase font-mono font-bold block">Ratios Salud</span>
                  
                  <div className="space-y-1.5 text-[9px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Ahorro:</span>
                      <span className={`font-bold ${savingRate >= 20 ? 'text-success' : savingRate >= 10 ? 'text-warning' : 'text-danger'}`}>
                        {savingRate.toFixed(1)}% (Rec: &gt;20%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-secondary">Ratio Deuda:</span>
                      <span className={`font-bold ${debtToIncomeRatio < 30 ? 'text-success' : debtToIncomeRatio < 40 ? 'text-warning' : 'text-danger'}`}>
                        {debtToIncomeRatio.toFixed(1)}% (Límite: 33%)
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Goal progress bento block */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest">
                  Metas SMART
                </h3>
                <button onClick={() => setActiveTab('goals')} className="text-[10px] uppercase font-mono text-gold-accent hover:underline flex items-center">
                  Ver detalle
                </button>
              </div>

              <div className="space-y-4">
                {goals.slice(0, 2).map(goal => {
                  const pct = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-txt-primary truncate max-w-[65%]">{goal.name}</span>
                        <span className="font-mono text-txt-secondary font-bold">{pct}%</span>
                      </div>
                      <div className={`w-full rounded-full h-2 overflow-hidden ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                        <div className="bg-gold-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] text-txt-muted font-mono leading-none">
                        <span>LÍMITE: {goal.deadline}</span>
                        <span>${goal.saved.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. ACCOUNTS NAVIGATION VIEW */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of current accounts */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-sm font-display font-medium text-gold-accent uppercase tracking-wider border-b border-white/5 pb-2">
                Pilar 2: Bóveda de Cuentas y Colchones
              </h3>

              <div className="space-y-3">
                {currentLinkedAccounts.map(acc => {
                  let badgeColor = '';
                  if (acc.type === 'operating') badgeColor = 'bg-teal-accent/10 text-teal-accent border-teal-accent/20';
                  if (acc.type === 'savings') badgeColor = 'bg-success/10 text-success border-success/20';
                  if (acc.type === 'investment') badgeColor = 'bg-gold-accent/15 text-gold-accent border-gold-accent/30';
                  if (acc.type === 'debt') badgeColor = 'bg-danger/10 text-danger border-danger/20';
                  if (acc.type === 'corporate') badgeColor = 'bg-neutral-400/10 text-neutral-300 border-neutral-400/20';
                  if (acc.type === 'pension') badgeColor = 'bg-[#AA80FF]/10 text-[#AA80FF] border-[#AA80FF]/25';

                  return (
                    <div key={acc.id} onClick={() => { setActiveAccount(acc); setActiveTab('account_detail'); }} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-black/10 cursor-pointer ${
                      acc.balance < 0 ? 'bg-danger/5 border-danger/10' : (theme === 'dark' ? 'bg-neutral-900/30 border-white/5' : 'bg-neutral-50 border-neutral-100')
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-txt-primary">{acc.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-black border ${badgeColor}`}>
                            {acc.type}
                          </span>
                        </div>
                        <p className="text-xs text-txt-muted">{acc.description}</p>
                      </div>

                      <div className="flex items-center gap-5 justify-between sm:justify-end" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <span className={`text-md font-mono font-black ${
                            acc.balance >= 0 ? (acc.id === 'acc-3' ? 'text-gold-accent' : 'text-txt-primary') : 'text-danger'
                          }`}>
                            ${acc.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                          </span>
                          {acc.id === 'acc-3' && (
                            <span className="text-[8px] text-gold-accent block font-mono uppercase tracking-tighter">
                              (+$ {tradesPnL.toFixed(1)} de Inversiones)
                            </span>
                          )}
                        </div>
                        
                        {/* Adjust balance button */}
                        <button 
                          onClick={() => handleEditAccountBalance(acc.id)}
                          className="p-1.5 hover:bg-gold-accent/20 text-txt-muted hover:text-gold-accent rounded-md transition-colors cursor-pointer"
                          title="Ajustar o inicializar balance"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Prevent deleting system base accounts to avoid state corrupting */}
                        {acc.id !== 'acc-1' && acc.id !== 'acc-3' && acc.id !== 'acc-5' && (
                          <button 
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1.5 hover:bg-danger/20 text-txt-muted hover:text-danger rounded-md transition-colors cursor-pointer"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* New Account form */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2">
                Añadir Nuevo Compartimento / Pot
              </h3>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Nombre del Compartimento</label>
                  <input 
                    type="text" 
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                    placeholder="Ej. Fondo Vacaciones o Hipoteca" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Tipo de Cuenta</label>
                  <select 
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  >
                    <option value="operating">Corriente operativa (Pagos)</option>
                    <option value="savings">Ahorro estructurado (Crecimiento)</option>
                    <option value="investment">Inversión (Broker, Crypto)</option>
                    <option value="debt">Deuda (Mortgages, Tarjetas)</option>
                    <option value="corporate">Empresa (Freelancing / SL)</option>
                    <option value="pension">Pensión / Jubilación</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Saldo Inicial (Usa negativo si es pasivo)</label>
                  <input 
                    type="number" 
                    value={accountForm.balance || ''}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: Number(e.target.value) })}
                    required
                    placeholder="Ej. 1500" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Pequeño Propósito</label>
                  <input 
                    type="text" 
                    value={accountForm.description}
                    onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                    placeholder="Ej. Dinero destinado a imprevistos" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gold-accent hover:bg-gold-accent/90 text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Registrar Compartimento
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT DETAIL VIEW */}
      {activeTab === 'account_detail' && activeAccount && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button onClick={() => setActiveTab('accounts')} className="text-xs text-txt-muted flex items-center gap-1 hover:text-gold-accent">
              <ChevronRight className="rotate-180 w-4 h-4" /> Volver a Cuentas
            </button>
            <h2 className="text-xl font-display font-black text-txt-primary">{activeAccount.name}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-neutral-900/40 border-white/5 space-y-4">
              <h3 className="text-sm font-bold">Balance</h3>
              <p className="text-3xl font-display font-black">${activeAccount.balance.toLocaleString('es-ES')}</p>
            </div>
            
            {/* Integrated Transactions/Budget View */}
            <div className="lg:col-span-2 p-6 rounded-2xl border bg-neutral-900/40 border-white/5 space-y-4">
               <h3 className="text-sm font-bold text-gold-accent">Transacciones</h3>
               <div className="space-y-2">
                 {transactions.filter(tx => tx.accountId === activeAccount.id).length > 0 ? (
                   transactions.filter(tx => tx.accountId === activeAccount.id).map(tx => (
                     <div key={tx.id} className="text-xs flex justify-between p-2 rounded-lg bg-white/5">
                       <span>{tx.description}</span>
                       <span className={tx.type === 'income' ? 'text-success' : 'text-danger'}>{tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}</span>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-txt-muted italic">No hay transacciones para esta cuenta.</p>
                 )}
               </div>
            </div>
            
            {/* Corporate section */}
            {activeAccount.type === 'corporate' && (
              <div className="lg:col-span-3 p-6 rounded-2xl border bg-neutral-900/40 border-white/5 space-y-4">
                <h3 className="text-sm font-bold">Empresa</h3>
                {/* Add corporate specific content here... */}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. GOALS NAVIGATION VIEW */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Goal dashboard list */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-sm font-display font-medium text-gold-accent uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-gold-accent animate-pulse" /> Pilar 4: "Goal-Based Budgeting" — Metas Financieras SMART
              </h3>

              <div className="space-y-4">
                {goals.map(goal => {
                  const pct = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
                  const remaining = Math.max(0, goal.target - goal.saved);
                  
                  // Calculate required monthly contribution
                  const deadlineDate = new Date(goal.deadline);
                  const today = new Date();
                  const yearsDiff = deadlineDate.getFullYear() - today.getFullYear();
                  const monthsDiff = (yearsDiff * 12) + (deadlineDate.getMonth() - today.getMonth());
                  const activeMonths = Math.max(1, monthsDiff);
                  const reqMonthly = remaining / activeMonths;

                  // Goal health states
                  let healthLabel = '🟢 En Fecha';
                  let healthColor = 'text-success bg-success/10 border-success/20';
                  if (pct < 30 && activeMonths < 12) {
                     healthLabel = '🔴 Crítico';
                     healthColor = 'text-danger bg-danger/10 border-danger/20';
                  } else if (pct < 60 && activeMonths < 18) {
                     healthLabel = '🟡 Demorado';
                     healthColor = 'text-warning bg-warning/10 border-warning/20';
                  }

                  return (
                    <div key={goal.id} className={`p-5 rounded-2xl border space-y-4 ${
                      theme === 'dark' ? 'bg-neutral-900/20 border-white/5' : 'bg-neutral-50 border-neutral-100'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="space-y-0.5">
                          <span className="font-display font-extrabold text-txt-primary">{goal.name}</span>
                          <span className="text-[9px] text-txt-muted font-mono uppercase block">{goal.category} • META: ${goal.target.toLocaleString()} • LÍMITE: {goal.deadline}</span>
                        </div>
                        <span className={`self-start sm:self-center px-2 py-0.5 rounded text-[8px] font-mono uppercase font-black border ${healthColor}`}>
                          {healthLabel} (Quedan {activeMonths}m)
                        </span>
                      </div>

                      {/* Bar progression */}
                      <div className="space-y-1">
                        <div className="w-full bg-neutral-800 h-3 rounded-full overflow-hidden">
                          <div className="bg-gold-accent h-full max-w-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-txt-secondary">
                          <span>Ahorrado: ${goal.saved.toLocaleString()} ({pct}%)</span>
                          <span>Faltan: ${remaining.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* SMART projections */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-black/15 p-3 rounded-xl border border-white/5 text-[11px]">
                        <div>
                          <span className="text-[9px] text-txt-muted uppercase font-mono block">Aporte Mensual Necesario</span>
                          <span className="font-mono font-bold text-txt-primary">${reqMonthly.toFixed(2)} / mes</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                          <div>
                            <span className="text-[9px] text-txt-muted uppercase font-mono block">Liquidez para Invertir</span>
                            <span className="text-gold-accent font-mono font-bold">Corriente: ${cashAvailable.toLocaleString('es-ES')}</span>
                          </div>
                          
                          {/* Contribute overlay action */}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                const amount = prompt(`¿Cuánto deseas aportar a "${goal.name}" desde tu Cuenta Corriente?`, "500");
                                if (amount) handleContributeToGoal(goal.id, Number(amount));
                              }}
                              className="px-3 py-1.5 bg-gold-accent hover:bg-gold-accent/95 text-black font-extrabold rounded-lg font-sans text-[10px] uppercase cursor-pointer"
                            >
                              + Aportar
                            </button>
                            <button 
                              onClick={() => setEditingGoal(goal)}
                              className="px-2 py-1.5 bg-neutral-900 border border-white/10 hover:bg-gold-accent/20 hover:text-gold-accent hover:border-gold-accent/30 text-txt-muted text-[10px] uppercase font-bold rounded-lg transition-colors cursor-pointer font-sans"
                              title="Editar meta"
                            >
                              Editar
                            </button>
                            <button 
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="px-2 py-1.5 bg-neutral-900 border border-white/10 hover:bg-danger/20 hover:text-danger hover:border-danger/30 text-txt-muted text-[10px] uppercase font-bold rounded-lg transition-colors cursor-pointer font-sans"
                              title="Eliminar meta"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* New Goal Creation */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2">
                Añadir Nueva Meta SMART
              </h3>

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Propósito de la Meta</label>
                  <input 
                    type="text" 
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    required
                    placeholder="Ej. Entrada Piso Barcelona" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24]' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Importe Objetivo (USD)</label>
                  <input 
                    type="number" 
                    value={goalForm.target}
                    onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                    required
                    placeholder="35000" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24]' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Mila de Base ya Ahorrado</label>
                  <input 
                    type="number" 
                    value={goalForm.saved}
                    onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
                    placeholder="8000" 
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24]' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Fecha Límite SMART</label>
                  <input 
                    type="date" 
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24]' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Prioridad Cronológica</label>
                  <select 
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24]' : 'bg-[#EFEDE8]/50 text-neutral-800'}`}
                  >
                    <option value="Urgente">Prioridad 🔴 Urgente (&lt; 12 meses)</option>
                    <option value="Medio plazo">Prioridad 🟡 Medio Plazo (1 a 5 años)</option>
                    <option value="Largo plazo">Prioridad 🟢 Largo Plazo (5+ años)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gold-accent hover:bg-gold-accent/90 text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Establecer Meta SMART
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* 5. INVESTMENTS TAB VIEW (Porting linked Trades) */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Investment Portfolio Tracker dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-sm font-display font-medium text-gold-accent uppercase tracking-wider border-b border-white/5 pb-2">
                Pilar 5: Portfolio de Activos del Diario de Inversiones vinculados
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-black/15 p-4 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-txt-muted uppercase font-mono block">Capital Inicial Estimado</span>
                  <span className="text-xl font-display font-black text-txt-primary">$15,000.00</span>
                </div>
                <div className="bg-black/15 p-4 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-txt-muted uppercase font-mono block">Beneficio Histórico Net</span>
                  <span className={`text-xl font-display font-black ${tradesPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${tradesPnL >= 0 ? '+' : ''}{tradesPnL.toLocaleString('es-ES', { minimumFractionDigits: 1 })}
                  </span>
                </div>
                <div className="bg-black/15 p-4 rounded-xl border border-white/5 text-center">
                  <span className="text-[9px] text-txt-muted uppercase font-mono block">Valoración de Liquidación</span>
                  <span className="text-xl font-display font-black text-gold-accent">
                    ${(15000 + tradesPnL).toLocaleString('es-ES', { minimumFractionDigits: 1 })}
                  </span>
                </div>
              </div>

              {/* Benchmarks comparisons */}
              <div className="p-4 bg-teal-accent/5 rounded-xl border border-teal-accent/20 space-y-3">
                <span className="text-[10px] font-mono uppercase text-teal-accent font-bold block">Comparación de Rendimiento vs Benchmarks</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-txt-primary font-bold">Tu Retorno Estimado (Broker)</span>
                    <span className={`font-mono font-black ${tradesPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                      {trades.length > 0 ? `${((tradesPnL / 15000) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div className="bg-gold-accent h-full" style={{ width: `${Math.max(0, Math.min(100, (tradesPnL / 15000) * 100))}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-txt-secondary border-t border-white/5 pt-2">
                    <div>
                      <span>⚓ Benchmark S&P 500:</span>
                      <span className="text-txt-primary font-bold ml-1">+9.2% / año</span>
                    </div>
                    <div>
                      <span>☄ Inflación Registrada:</span>
                      <span className="text-danger font-bold ml-1">3.1% / año</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* List of active trades mapped */}
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2">
                Tesis y Posiciones Abiertas Registradas en el Diario
              </h3>

              {trades.length > 0 ? (
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {trades.slice(0, 5).map(t => (
                    <div key={t.id} className="p-4 bg-black/10 rounded-xl border border-white/5 space-y-2.5">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1 flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-txt-primary">{t.active}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${
                            t.direction === 'LONG' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                          }`}>
                            {t.direction}
                          </span>
                        </div>
                        <span className={`font-mono font-black text-xs ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-txt-secondary">
                        <div>
                          <span>ESTRATEGIA:</span>
                          <span className="text-txt-primary font-bold block">{t.setups ? t.setups.at(0) || 'Lógica Base' : 'Lógica Base'}</span>
                        </div>
                        <div>
                          <span>TASA RR:</span>
                          <span className="text-gold-accent font-bold block">{t.rr} R</span>
                        </div>
                        <div>
                          <span>ADHERENCIA:</span>
                          <span className="text-teal-accent font-bold block">{t.planAdherence}% AP</span>
                        </div>
                      </div>

                      {t.notes && (
                        <p className="text-[10px] text-txt-muted italic bg-neutral-900/40 p-2 rounded border border-white/5">
                          "Tesis: {t.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-txt-muted italic py-6 text-center">Registra tu primer análisis macro y trade en el "Diario de Inversiones" para ver reflejado tu rendimiento.</p>
              )}
            </div>

          </div>

          {/* Investment Advisor integration with KK Macro Radar */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
              <h3 className="text-xs font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2">
                Asistente de Inversión vinculante (Kosmopoly Macro)
              </h3>
              
              <div className="space-y-3.5 text-xs text-txt-secondary leading-relaxed">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-gold-accent shrink-0" />
                  <p>
                    <b className="text-txt-primary block">Tesis Macroeconómica Vinculada:</b> Tu diario de trading se ha reestructurado fiscalmente como <b>Diario de Inversiones</b>. Cada orden de trading ejecutada arrastra su propia tesis conectada al Radar Macro de divisas mundiales para respaldar la ventaja técnica.
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-black/10 p-3 border border-white/5">
                  <Info className="w-4 h-4 text-teal-accent shrink-0" />
                  <p className="text-[11px]">
                    <b className="text-teal-accent block uppercase font-mono text-[9px] mb-0.5">Asignación de Dividendos</b>
                    Recuerda que cada ingreso pasivo o dividendo derivado de estas posiciones fluirá automáticamente al motor de flujos en la sección "Ingresos & Gastos" para mantener tu YNAB en equilibrio.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 6. CORPORATE / FREELANCE MÓDULO EMPRESA VIEW - REMOVED, INTEGRATED INTO ACCOUNT DETAIL */}

      {/* 7. ADVISOR / INTELIGENCIA INTEGRADA VIEW */}

      {/* 7. ADVISOR / INTELIGENCIA INTEGRADA VIEW */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#10121A] border-white/5' : 'bg-white border-neutral-200 shadow-sm'} space-y-4`}>
            
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Sparkles className="w-6 h-6 text-gold-accent animate-pulse" />
              <div className="space-y-0.5">
                <h3 className="text-md font-display font-medium text-gold-accent uppercase tracking-wider">
                  Pilar 7: Consejero Autónomo de Inteligencia Financiera
                </h3>
                <p className="text-xs text-txt-muted">Auditoría automática de ratios vitales y diagnósticos de libertad patrimonial.</p>
              </div>
            </div>

            {/* Comprehensive health table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 uppercase tracking-wider font-mono text-txt-secondary text-[9px]">
                    <th className="py-3 px-4">Indicador / Ratio Vital</th>
                    <th className="py-3 px-4">Fórmula Contable Aplicada</th>
                    <th className="py-3 px-4">Sugerencia Recomendada</th>
                    <th className="py-3 px-4">Tu Lectura Real</th>
                    <th className="py-3 px-4 text-center">Diagnóstico Semáforo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-txt-primary">
                  
                  {/* Ratio 1: Tasa de ahorro */}
                  <tr>
                    <td className="py-4 px-4 font-bold">Tasa de Ahorro</td>
                    <td className="py-4 px-4 font-mono text-[10px]">Ahorro Neto / Ingresos</td>
                    <td className="py-4 px-4">Mínimo ideal &gt;20%</td>
                    <td className="py-4 px-4 font-mono text-sm font-bold">{savingRate.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-black ${
                        savingRate >= 20 ? 'bg-success/15 text-success' : savingRate >= 10 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'
                      }`}>
                        {savingRate >= 20 ? '🟢 ÓPTIMAL' : savingRate >= 10 ? '🟡 ADVERTENCIA' : '🔴 BAJO'}
                      </span>
                    </td>
                  </tr>

                  {/* Ratio 2: Ratio Deuda */}
                  <tr>
                    <td className="py-4 px-4 font-bold">Ratio Deuda / Ingresos</td>
                    <td className="py-4 px-4 font-mono text-[10px]">Cuota Préstamos / Ingresos</td>
                    <td className="py-4 px-4">Límite saludable &lt;33%</td>
                    <td className="py-4 px-4 font-mono text-sm font-bold">{debtToIncomeRatio.toFixed(1)}%</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-black ${
                        debtToIncomeRatio < 33 ? 'bg-success/15 text-success' : debtToIncomeRatio < 40 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'
                      }`}>
                        {debtToIncomeRatio < 33 ? '🟢 SALUDABLE' : debtToIncomeRatio < 40 ? '🟡 DEMASIADO ALTO' : '🔴 ALERTA ROJA'}
                      </span>
                    </td>
                  </tr>

                  {/* Ratio 3: Cobertura de emergencias */}
                  <tr>
                    <td className="py-4 px-4 font-bold">Cobertura de Emergencia</td>
                    <td className="py-4 px-4 font-mono text-[10px]">Fondo / Gasto Mensual Estimado</td>
                    <td className="py-4 px-4">Recomendado &gt; 6 meses</td>
                    <td className="py-4 px-4 font-mono text-sm font-bold">{emergencyCoverageMonths.toFixed(1)} meses</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-black ${
                        emergencyCoverageMonths >= 6 ? 'bg-success/15 text-success' : emergencyCoverageMonths >= 3 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'
                      }`}>
                        {emergencyCoverageMonths >= 6 ? '🟢 CORDÓN ROBUSTO' : emergencyCoverageMonths >= 3 ? '🟡 REGULAR' : '🔴 ALERTA DE FLUIDEZ'}
                      </span>
                    </td>
                  </tr>

                  {/* Ratio 4: FI Number */}
                  <tr>
                    <td className="py-4 px-4 font-bold">Progreso Independencia Financiera</td>
                    <td className="py-4 px-4 font-mono text-[10px]">Patrimonio / Gasto Anual x25</td>
                    <td className="py-4 px-4">Camino hacia la jubilación FI</td>
                    <td className="py-4 px-4 font-mono text-sm font-bold">
                      {Math.min(100, Math.round((netWorth / 250000) * 100))}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-3 py-1 rounded-full text-[9px] font-mono font-black bg-[#AA80FF]/15 text-[#AA80FF]">
                        🚀 TRAYECTO ACTIVO
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Strategic advisor text */}
            <div className="p-4 bg-black/15 border border-white/5 rounded-xl text-xs space-y-3 leading-relaxed">
              <span className="text-[10px] font-mono uppercase text-gold-accent font-bold block">Tesis de Recomendación Global del Consejero IA</span>
              
              <p>
                Tus finanzas presentan un sesgo estructural balanceado con Patrimonio total de <b className="text-gold-accent">${netWorth.toLocaleString()} USD</b>. Sin embargo, advertimos que la relación de esferas Fiscales de tu corporación de trading requiere liquidez recurrente. Realiza aportes periódicos para equilibrar la Tasa de Ahorro por encima del 20% utilizando la barra interactiva de las Metas SMART.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ================= EDIT MODALS OVERLAYS ================= */}
      
      {/* 1. Account Editing Drawer/Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingAccount(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Cuenta Financiera
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Nombre de la Cuenta</label>
                <input 
                  type="text" 
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Descripción o Notas</label>
                <input 
                  type="text" 
                  value={editingAccount.description}
                  onChange={(e) => setEditingAccount({ ...editingAccount, description: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Tipo de Cuenta</label>
                  <select 
                    value={editingAccount.type}
                    onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="operating">Corriente / Operaciones</option>
                    <option value="savings">Ahorros / Emergencias</option>
                    <option value="investment">Inversiones / Broker</option>
                    <option value="debt">Deuda / Préstamos</option>
                    <option value="corporate">Corporativa / Empresa</option>
                    <option value="pension">Pensiones / Retiro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Balance actual (USD)</label>
                  <input 
                    type="number" 
                    value={editingAccount.balance}
                    onChange={(e) => setEditingAccount({ ...editingAccount, balance: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingAccount(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleSaveEditedAccount(editingAccount)}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Subscription Editing Modal */}
      {editingSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingSubscription(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Suscripción / Gasto Fijo
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Nombre del Gasto / Suscripción</label>
                <input 
                  type="text" 
                  value={editingSubscription.name}
                  onChange={(e) => setEditingSubscription({ ...editingSubscription, name: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Importe Coste (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingSubscription.amount}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, amount: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Frecuencia</label>
                  <select 
                    value={editingSubscription.frequency}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, frequency: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Siguiente Renovación</label>
                  <input 
                    type="date" 
                    value={editingSubscription.renewalDate}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, renewalDate: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Categoría de Gasto</label>
                  <select 
                    value={editingSubscription.category}
                    onChange={(e) => setEditingSubscription({ ...editingSubscription, category: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="Necesidades fijas">Necesidades fijas</option>
                    <option value="Estilo de vida">Estilo de vida</option>
                    <option value="Ahorro e inversión">Ahorro e inversión</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingSubscription(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleSaveEditedSubscription(editingSubscription)}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Goal Editing Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingGoal(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Meta de Ahorro SMART
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Propósito / Nombre de la Meta</label>
                <input 
                  type="text" 
                  value={editingGoal.name}
                  onChange={(e) => setEditingGoal({ ...editingGoal, name: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Objetivo / Meta (USD)</label>
                  <input 
                    type="number" 
                    value={editingGoal.target}
                    onChange={(e) => setEditingGoal({ ...editingGoal, target: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Ahorrado actual (USD)</label>
                  <input 
                    type="number" 
                    value={editingGoal.saved}
                    onChange={(e) => setEditingGoal({ ...editingGoal, saved: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Fecha límite (Deadline)</label>
                  <input 
                    type="date" 
                    value={editingGoal.deadline}
                    onChange={(e) => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Categoría de Prioridad</label>
                  <select 
                    value={editingGoal.category}
                    onChange={(e) => setEditingGoal({ ...editingGoal, category: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="Urgente">Urgente</option>
                    <option value="Medio plazo">Medio plazo</option>
                    <option value="Largo plazo">Largo plazo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingGoal(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleSaveEditedGoal(editingGoal)}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Transaction Editing Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingTransaction(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Transacción Registrada
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Descripción o Concepto</label>
                <input 
                  type="text" 
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Tipo de Flujo</label>
                  <select 
                    value={editingTransaction.type}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="income">Ingreso / Cobro (+)</option>
                    <option value="expense">Gasto / Retiro (-)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Importe (USD)</label>
                  <input 
                    type="number" 
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Fecha de Registro</label>
                  <input 
                    type="date" 
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Cuenta Involucrada</label>
                  <select 
                    value={editingTransaction.accountId}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Categoría Operativa</label>
                <select 
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                >
                  <option value="Necesidades fijas (~50%)">Necesidades fijas: Vivienda, Seguros, Hipotecas</option>
                  <option value="Necesidades variables">Necesidades variables: Alimentación, Salud, Combustible</option>
                  <option value="Estilo de vida (~30%)">Estilo de vida: Ocio, Restaurantes, Cafés, Caprichos</option>
                  <option value="Ahorro e inversión (~20%)">Suscripciones / Ahorro asignado</option>
                  <option value="Ingresos Recurrentes (Nómina)">Ingresos Recurrentes: Nómina base, Alquileres cobrados</option>
                  <option value="Ingresos variables">Ingresos Variables: Freelancing, Ventas directas, Bonus</option>
                  <option value="Ingresos pasivos">Ingresos Pasivos: Dividendos, Rendimiento de Broker</option>
                  <option value="Ingresos extraordinarios">Ingresos Extraordinarios: Herencias, Ventas de capital</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const originalTx = transactions.find(t => t.id === editingTransaction.id);
                    if (originalTx) handleSaveEditedTransaction(editingTransaction, originalTx);
                  }}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Invoice Editing Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingInvoice(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Factura Corporativa
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Código / Número Factura</label>
                  <input 
                    type="text" 
                    value={editingInvoice.number}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, number: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Nombre Cliente</label>
                  <input 
                    type="text" 
                    value={editingInvoice.client}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, client: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Base Imponible (USD)</label>
                  <input 
                    type="number" 
                    value={editingInvoice.amount}
                    onChange={(e) => {
                      const base = Number(e.target.value);
                      setEditingInvoice({ ...editingInvoice, amount: base, taxes: Math.round(base * 0.21 * 100) / 100 });
                    }}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Impuestos Calculados (IVA 21%)</label>
                  <input 
                    type="number" 
                    readOnly
                    value={editingInvoice.taxes}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent bg-neutral-900/40 text-txt-secondary font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Fecha Emitida</label>
                  <input 
                    type="date" 
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Estado Actual</label>
                  <select 
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="PAGADA">PAGADA</option>
                    <option value="EN MORA">EN MORA</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingInvoice(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const originalInv = invoices.find(i => i.id === editingInvoice.id);
                    if (originalInv) handleSaveEditedInvoice(editingInvoice, originalInv);
                  }}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Corporate Expense Editing Modal */}
      {editingCorpExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setEditingCorpExpense(null)} 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
          />
          <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border z-10 ${
            theme === 'dark' ? 'bg-[#10121A] border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <h3 className="text-sm font-mono font-bold uppercase text-gold-accent tracking-widest border-b border-white/5 pb-2 mb-4">
              Personalizar Gasto Empresarial
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Descripción de Gasto Corporativo</label>
                <input 
                  type="text" 
                  value={editingCorpExpense.description}
                  onChange={(e) => setEditingCorpExpense({ ...editingCorpExpense, description: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Importe Total (USD)</label>
                  <input 
                    type="number" 
                    value={editingCorpExpense.amount}
                    onChange={(e) => setEditingCorpExpense({ ...editingCorpExpense, amount: Number(e.target.value) })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Deducibilidad Fiscal</label>
                  <select 
                    value={editingCorpExpense.deducibility}
                    onChange={(e) => setEditingCorpExpense({ ...editingCorpExpense, deducibility: e.target.value as any })}
                    className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                  >
                    <option value="100%">Deducible Completo (100%)</option>
                    <option value="50%">Deducible Parcial (50%)</option>
                    <option value="0%">No Deducible (0%)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Fecha de Registro</label>
                <input 
                  type="date" 
                  value={editingCorpExpense.date}
                  onChange={(e) => setEditingCorpExpense({ ...editingCorpExpense, date: e.target.value })}
                  className={`w-full p-2 text-xs rounded-xl border border-transparent ${theme === 'dark' ? 'bg-[#1a1c24] text-txt-primary' : 'bg-[#EFEDE8]/50 text-neutral-800 border-neutral-200'}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button 
                  onClick={() => setEditingCorpExpense(null)}
                  className={`px-4 py-2 text-xs rounded-lg border font-medium ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const originalExp = corpExpenses.find(e => e.id === editingCorpExpense.id);
                    if (originalExp) handleSaveEditedCorpExpense(editingCorpExpense, originalExp);
                  }}
                  className="px-4 py-2 text-xs bg-gold-accent hover:bg-gold-accent/90 text-black font-extrabold rounded-lg font-mono uppercase"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
