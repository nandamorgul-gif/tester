/**
 * MORGUL Store - Checkout & Midtrans Payment Handler
 */

let currentInvoice = null;
let timerInterval = null;
let currentSnapToken = null;

async function processCheckout() {
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
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceId = `MORGUL-${dateStr}-${randomCode}`;

  let totalPay = calculateTotal();
  let basePrice = selectedNominal.price;
  let adminFee = selectedPayment.fee;
  let promoDiscount = appliedPromo ? (appliedPromo.discountAmount || (basePrice * appliedPromo.discountPercent / 100)) : 0;

  let isWalletPay = selectedPayment.id === 'wallet';

  if (isWalletPay) {
    const payResult = MorgulWallet.payWithWallet(totalPay, invoiceId, selectedNominal.name);
    if (!payResult.success) {
      alert(payResult.message + ' Silakan lakukan deposit saldo terlebih dahulu di Backend Dashboard!');
      return;
    }
  }

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
    status: isWalletPay ? 'SUKSES' : 'MENUNGGU PEMBAYARAN',
    createdAt: new Date().toLocaleTimeString('id-ID'),
    serialNumber: null
  };

  currentSnapToken = null;

  // Render modal invoice
  renderInvoiceModal();

  if (isWalletPay) {
    fulfillProviderOrder(currentInvoice);
  } else {
    await initiateMidtransPayment(currentInvoice);
  }
}

async function fulfillProviderOrder(invoice) {
  if (!invoice || invoice.serialNumber) return;

  try {
    const res = await fetch('/api/provider/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: invoice.id,
        gameTitle: invoice.gameTitle,
        itemName: invoice.itemName,
        userAccount: invoice.userAccount,
        waNumber: invoice.waNumber
      })
    });
    const data = await res.json();
    if (data.success && data.serialNumber) {
      invoice.serialNumber = data.serialNumber;
      renderInvoiceModal();
    }
  } catch (err) {
    invoice.serialNumber = `SN-MORGUL-${Date.now().toString().slice(-6)}-8824`;
    renderInvoiceModal();
  }
}

async function initiateMidtransPayment(invoice) {
  try {
    const response = await fetch('/api/midtrans/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: invoice.id,
        totalPay: invoice.totalPay,
        gameTitle: invoice.gameTitle,
        itemName: invoice.itemName,
        userAccount: invoice.userAccount,
        paymentMethod: invoice.paymentMethod,
        waNumber: invoice.waNumber
      })
    });

    const result = await response.json();

    if (result.success && result.token) {
      currentSnapToken = result.token;
      triggerMidtransSnap(result.token);
    } else if (result.isMock) {
      console.warn('Midtrans Mode: Server Key belum diset. Menampilkan opsi rincian instruksi.');
    }
  } catch (err) {
    console.log('Mode Standalone: Backend server tidak aktif, menggunakan tampilan invoice standar.');
  }
}

function triggerMidtransSnap(token) {
  const snapToken = token || currentSnapToken;
  if (!snapToken) {
    alert('Midtrans Snap Token belum tersedia atau Server Key belum dikonfigurasi!');
    return;
  }

  if (typeof window.snap === 'undefined') {
    alert('Midtrans Snap SDK belum dimuat. Pastikan koneksi internet terhubung.');
    return;
  }

  window.snap.pay(snapToken, {
    onSuccess: function (result) {
      console.log('Midtrans Payment Success:', result);
      if (currentInvoice) {
        currentInvoice.status = 'SUKSES';
        renderInvoiceModal();
        fulfillProviderOrder(currentInvoice);
      }
    },
    onPending: function (result) {
      console.log('Midtrans Payment Pending:', result);
      if (currentInvoice) {
        currentInvoice.status = 'MENUNGGU PEMBAYARAN';
        renderInvoiceModal();
      }
    },
    onError: function (result) {
      console.error('Midtrans Payment Error:', result);
      alert('Pembayaran gagal atau dibatalkan.');
    },
    onClose: function () {
      console.log('Snap Popup ditutup pengguna.');
    }
  });
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

      ${isSuccess ? `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; padding: 0.85rem; border-radius: 8px; margin: 0.75rem 0; text-align: center;">
          <div style="font-size: 0.75rem; color: #10b981; font-weight: 700; text-transform: uppercase;">
            <i class="fa-solid fa-circle-check"></i> Serial Number / SN Kode Ref Top Up:
          </div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: 1px; margin-top: 4px; font-family: monospace;">
            ${currentInvoice.serialNumber || '<i class="fa-solid fa-spinner fa-spin"></i> Memproses ke Provider...'}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
            Item Top-Up otomatis diproses & dikirim 24/7.
          </div>
        </div>
      ` : ''}

      <!-- Payment Visual Details -->
      ${!isSuccess ? `
        <div style="margin: 1rem 0;">
          ${currentSnapToken ? `
            <button class="btn-simulate-pay" style="background: linear-gradient(135deg, #0284c7, #0369a1); margin-bottom: 0.75rem;" onclick="triggerMidtransSnap()">
              <i class="fa-solid fa-credit-card"></i> Bayar via Midtrans Snap Popup
            </button>
          ` : ''}

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
        </div>
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
  fulfillProviderOrder(currentInvoice);
}
