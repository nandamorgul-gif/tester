/**
 * MORGUL Store - Wallet & Financial Backend Management System
 * Persists balance, deposit requests, withdrawals, and transaction history using localStorage.
 */

const WALLET_STORAGE_KEY = 'morgul_wallet_data_v1';

// Default initial state
const defaultWalletState = {
  balance: 2500000, // Rp 2.500.000 default balance for demo
  deposits: [
    {
      id: 'DEP-20260809-001',
      date: '2026-08-09 10:15',
      amount: 1000000,
      method: 'QRIS Instant',
      status: 'SUKSES',
      notes: 'Isi Saldo via QRIS'
    },
    {
      id: 'DEP-20260808-002',
      date: '2026-08-08 14:30',
      amount: 1500000,
      method: 'BCA Virtual Account',
      status: 'SUKSES',
      notes: 'Transfer Bank BCA'
    }
  ],
  withdrawals: [
    {
      id: 'WD-20260809-001',
      date: '2026-08-09 16:45',
      amount: 500000,
      bank: 'Bank BCA',
      accountNumber: '8801239847',
      accountName: 'MORGUL STORE ADMIN',
      adminFee: 2500,
      status: 'SUKSES'
    }
  ],
  mutations: [
    {
      id: 'MUT-20260809-101',
      date: '2026-08-09 10:15',
      type: 'DEPOSIT',
      amount: 1000000,
      description: 'Deposit Saldo via QRIS Instant',
      status: 'SUKSES'
    },
    {
      id: 'MUT-20260809-102',
      date: '2026-08-09 16:45',
      type: 'WITHDRAWAL',
      amount: 502500,
      description: 'Penarikan Dana ke Bank BCA (8801239847)',
      status: 'SUKSES'
    }
  ]
};

class WalletManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load wallet state from localStorage:', e);
    }
    this.saveState(defaultWalletState);
    return defaultWalletState;
  }

  saveState(state = this.state) {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save wallet state:', e);
    }
  }

  getBalance() {
    return this.state.balance || 0;
  }

  formatRupiah(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  // Process Deposit
  processDeposit(amount, method) {
    amount = Number(amount);
    if (!amount || amount < 10000) {
      return { success: false, message: 'Minimal deposit adalah Rp 10.000!' };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randId = Math.floor(1000 + Math.random() * 9000);
    const depositId = `DEP-${dateStr}-${randId}`;

    const newDeposit = {
      id: depositId,
      date: now.toLocaleString('id-ID'),
      amount: amount,
      method: method,
      status: 'SUKSES',
      notes: `Isi Saldo Instant via ${method}`
    };

    // Update state
    this.state.balance += amount;
    this.state.deposits.unshift(newDeposit);
    this.state.mutations.unshift({
      id: `MUT-${dateStr}-${randId}`,
      date: now.toLocaleString('id-ID'),
      type: 'DEPOSIT',
      amount: amount,
      description: `Deposit Saldo via ${method}`,
      status: 'SUKSES'
    });

    this.saveState();
    return {
      success: true,
      message: `Berhasil deposit ${this.formatRupiah(amount)} via ${method}!`,
      deposit: newDeposit
    };
  }

  // Process Withdrawal (Tarik Uang)
  processWithdrawal(amount, bank, accountNumber, accountName) {
    amount = Number(amount);
    const adminFee = 2500;
    const totalDeducted = amount + adminFee;

    if (!amount || amount < 50000) {
      return { success: false, message: 'Minimal penarikan uang adalah Rp 50.000!' };
    }

    if (totalDeducted > this.state.balance) {
      return { 
        success: false, 
        message: `Saldo tidak mencukupi! Total dibthkan (Nominal + Biaya Admin Rp 2.500) = ${this.formatRupiah(totalDeducted)}, Saldo Anda: ${this.formatRupiah(this.state.balance)}` 
      };
    }

    if (!accountNumber || !accountName) {
      return { success: false, message: 'Mohon isi nomor rekening dan nama pemilik rekening!' };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randId = Math.floor(1000 + Math.random() * 9000);
    const wdId = `WD-${dateStr}-${randId}`;

    const newWd = {
      id: wdId,
      date: now.toLocaleString('id-ID'),
      amount: amount,
      bank: bank,
      accountNumber: accountNumber,
      accountName: accountName,
      adminFee: adminFee,
      status: 'SUKSES'
    };

    // Deduct balance
    this.state.balance -= totalDeducted;
    this.state.withdrawals.unshift(newWd);
    this.state.mutations.unshift({
      id: `MUT-${dateStr}-${randId}`,
      date: now.toLocaleString('id-ID'),
      type: 'WITHDRAWAL',
      amount: totalDeducted,
      description: `Penarikan Dana ke ${bank} (${accountNumber} a/n ${accountName})`,
      status: 'SUKSES'
    });

    this.saveState();
    return {
      success: true,
      message: `Penarikan Rp ${amount.toLocaleString('id-ID')} ke ${bank} (${accountNumber}) berhasil diproses!`,
      withdrawal: newWd
    };
  }

  // Deduct balance for store purchase
  payWithWallet(totalAmount, invoiceId, itemName) {
    if (totalAmount > this.state.balance) {
      return { success: false, message: `Saldo Wallet tidak mencukupi (${this.formatRupiah(this.state.balance)})!` };
    }

    const now = new Date();
    this.state.balance -= totalAmount;
    this.state.mutations.unshift({
      id: `MUT-${now.toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
      date: now.toLocaleString('id-ID'),
      type: 'PEMBELIAN',
      amount: totalAmount,
      description: `Pembelian Top-Up ${itemName} (Inv: ${invoiceId})`,
      status: 'SUKSES'
    });

    this.saveState();
    return { success: true, message: 'Pembayaran dengan Saldo Wallet MORGUL berhasil!' };
  }
}

// Global Singleton Instance
const MorgulWallet = new WalletManager();
