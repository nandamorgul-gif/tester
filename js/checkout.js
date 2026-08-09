/**
 * MORGUL Store - Checkout & Payment Simulation Handler
 */

let currentInvoice = null;
let timerInterval = null;

function processCheckout() {
  const userId = document.getElementById('userIdInput')?.value.trim();
  const serverId = document.getElementById('serverIdInput')?.value.trim();
  const wa = document.getElementById('waInput')?.value.trim();

  if (!userId) {
    alert('Mohon masukkan User ID / Account ID Game Anda!');
    return;
  }

  if (!selectedNominal) {
    alert('Mohon pilih Nominal Top-Up yang diinginkan!');
    return;
  }

  if (!selectedPayment) {
    alert('Mohon pilih Metode Pembayaran terlebih dahulu!');
    return;
  }

  if (!wa) {
    alert('Mohon masukkan nomor WhatsApp untuk pengiriman invoice!');
    return;
  }

  // Close Top-up Modal
  closeModal('topupModal');

  // Generate Invoice Object
  const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const invoiceId = `MORGUL-${dateStr}-${randomCode}`;

  let totalPay = calculateTotal();
  let basePrice = selectedNominal.price;
  let adminFee = selectedPayment.fee;
  let promoDiscount = appliedPromo ? (appliedPromo.discountAmount || (basePrice * appliedPromo.discountPercent / 100)) : 0;

  currentInvoice = {
    id: invoiceId,
    gameTitle: selectedGame.title,
    userAccount: serverId ? `${userId} (${serverId})` : userId,
    itemName: selectedNominal.name,
    basePrice: basePrice,
    adminFee: adminFee,
    promoDiscount: promoDiscount,
    totalPay: totalPay,
    paymentMethod: selectedPayment.id.toUpperCase(),
    waNumber: wa,
    status: 'MENUNGGU PEMBAYARAN',
    createdAt: new Date().toLocaleTimeString('id-ID')
  };

  renderInvoiceModal();
}

function renderInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  const body = document.getElementById('invoiceModalBody');

  if (!currentInvoice || !modal || !body) return;

  const isSuccess = currentInvoice.status === 'SUKSES';

  body.innerHTML = `
    <div class="invoice-card">
      <span class="${isSuccess ? 'invoice-badge-success' : 'invoice-badge-pending'}">
        <i class="fa-solid ${isSuccess ? 'fa-circle-check' : 'fa-clock'}"></i> ${currentInvoice.status}
      </span>
      
      <div style="font-size: 0.85rem; color: var(--text-muted);">No. Invoice / Pesanan:</div>
      <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-cyan); letter-spacing: 1px; margin-bottom: 0.5rem;">
        ${currentInvoice.id}
      </div>

      ${!isSuccess ? `
        <div style="font-size: 0.8rem; color: var(--text-secondary);">Selesaikan Pembayaran Sebelum:</div>
        <div class="invoice-timer" id="paymentTimer">15:00</div>
      ` : ''}

      <!-- Payment Visual Details -->
      ${!isSuccess ? `
        ${currentInvoice.paymentMethod === 'QRIS' ? `
          <div class="qris-box">
            <img src="assets/images/favicon.png" class="qris-img" alt="QRIS Code" style="padding: 10px; background: #000; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #000; font-weight: 700; margin-top: 4px;">SCAN QRIS DENGAN DANA/GOPAY/OVO/BCA</div>
          </div>
        ` : `
          <div style="background: rgba(139, 92, 246, 0.1); border: 1px dashed var(--accent-purple); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Nomor Rekening / Virtual Account:</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-gold); letter-spacing: 2px;">
              88019${Math.floor(10000000 + Math.random() * 90000000)}
            </div>
            <button onclick="navigator.clipboard.writeText('8801912345678'); alert('Nomor Rekening berhasil disalin!')" 
                    style="margin-top: 6px; padding: 4px 12px; background: var(--accent-purple); color: white; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 0.75rem;">
              <i class="fa-solid fa-copy"></i> Salin Nomor VA
            </button>
          </div>
        `}
      ` : ''}

      <!-- Breakdown Table -->
      <table class="invoice-table">
        <tr>
          <td>Game & Akun</td>
          <td>${currentInvoice.gameTitle} (${currentInvoice.userAccount})</td>
        </tr>
        <tr>
          <td>Item Top-Up</td>
          <td>${currentInvoice.itemName}</td>
        </tr>
        <tr>
          <td>Harga Item</td>
          <td>Rp ${currentInvoice.basePrice.toLocaleString('id-ID')}</td>
        </tr>
        ${currentInvoice.promoDiscount > 0 ? `
          <tr style="color: #10b981;">
            <td>Diskon Promo</td>
            <td>-Rp ${currentInvoice.promoDiscount.toLocaleString('id-ID')}</td>
          </tr>
        ` : ''}
        <tr>
          <td>Biaya Admin (${currentInvoice.paymentMethod})</td>
          <td>Rp ${currentInvoice.adminFee.toLocaleString('id-ID')}</td>
        </tr>
        <tr style="font-size: 1rem; border-top: 1px solid var(--accent-purple);">
          <td style="color: var(--text-main); font-weight: 800;">Total Bayar</td>
          <td style="color: var(--accent-gold); font-weight: 800;">Rp ${currentInvoice.totalPay.toLocaleString('id-ID')}</td>
        </tr>
      </table>

      ${!isSuccess ? `
        <button class="btn-simulate-pay" onclick="simulatePaymentSuccess()">
          <i class="fa-solid fa-bolt"></i> Simulasi Pembayaran Sukses (Instant)
        </button>
      ` : `
        <button class="btn-simulate-pay" style="background: linear-gradient(135deg, #10b981, #059669);" onclick="window.print()">
          <i class="fa-solid fa-print"></i> Cetak Struk / Invoice Digital
        </button>
      `}
    </div>
  `;

  modal.classList.add('active');

  if (!isSuccess) {
    startPaymentTimer(900); // 15 Minutes
  }
}

function startPaymentTimer(durationInSeconds) {
  if (timerInterval) clearInterval(timerInterval);

  let timer = durationInSeconds;
  timerInterval = setInterval(() => {
    const minutes = parseInt(timer / 60, 10);
    const seconds = parseInt(timer % 60, 10);

    const displayMins = minutes < 10 ? "0" + minutes : minutes;
    const displaySecs = seconds < 10 ? "0" + seconds : seconds;

    const timerEl = document.getElementById('paymentTimer');
    if (timerEl) {
      timerEl.textContent = displayMins + ":" + displaySecs;
    }

    if (--timer < 0) {
      clearInterval(timerInterval);
      if (currentInvoice) {
        currentInvoice.status = 'EXPIRED';
        renderInvoiceModal();
      }
    }
  }, 1000);
}

function simulatePaymentSuccess() {
  if (!currentInvoice) return;

  if (timerInterval) clearInterval(timerInterval);

  currentInvoice.status = 'SUKSES';
  renderInvoiceModal();
}
