/**
 * MORGUL Store - Order Tracker (Cek Transaksi)
 */

function openTrackerModal() {
  const modal = document.getElementById('trackerModal');
  if (modal) modal.classList.add('active');
}

function searchOrder() {
  const input = document.getElementById('trackerInput')?.value.trim();
  const resEl = document.getElementById('trackerResult');

  if (!resEl) return;

  if (!input) {
    resEl.innerHTML = `
      <div style="color: #ef4444; font-size: 0.88rem; text-align: center; padding: 1rem;">
        <i class="fa-solid fa-triangle-exclamation"></i> Silakan masukkan Nomor Invoice atau WhatsApp Anda!
      </div>
    `;
    return;
  }

  // Check if matches current active invoice or generate simulated order status
  let isCurrent = currentInvoice && (currentInvoice.id.toUpperCase() === input.toUpperCase() || currentInvoice.waNumber === input);

  let mockStatus = isCurrent ? currentInvoice.status : 'SUKSES';
  let mockInvoice = isCurrent ? currentInvoice.id : (input.startsWith('MORGUL-') ? input.toUpperCase() : `MORGUL-20260809-${Math.random().toString(36).substring(2,6).toUpperCase()}`);
  let mockGame = isCurrent ? currentInvoice.gameTitle : 'Mobile Legends';
  let mockItem = isCurrent ? currentInvoice.itemName : '257 Diamonds (234 + 23 Bonus)';
  let mockAccount = isCurrent ? currentInvoice.userAccount : '12345678 (2024)';

  resEl.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-glow); padding: 1.25rem; border-radius: var(--radius-md); margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Invoice ID:</div>
          <div style="font-weight: 800; color: var(--accent-cyan); font-size: 1rem;">${mockInvoice}</div>
        </div>
        <span class="${mockStatus === 'SUKSES' ? 'invoice-badge-success' : 'invoice-badge-pending'}" style="margin:0;">
          ${mockStatus}
        </span>
      </div>

      <!-- Stepper Progress Bar -->
      <div style="display: flex; justify-content: space-between; position: relative; margin: 1.5rem 0 1rem;">
        <div style="position: absolute; top: 12px; left: 10%; width: 80%; height: 3px; background: rgba(255,255,255,0.1); z-index: 1;"></div>
        <div style="position: absolute; top: 12px; left: 10%; width: ${mockStatus === 'SUKSES' ? '80%' : '40%'}; height: 3px; background: var(--accent-purple); z-index: 1; transition: width 0.4s ease;"></div>

        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--accent-purple); color: white; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">1</div>
          <div style="font-size: 0.72rem; color: var(--text-main); margin-top: 4px; font-weight: 700;">Dibuat</div>
        </div>

        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--accent-purple); color: white; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">2</div>
          <div style="font-size: 0.72rem; color: var(--text-main); margin-top: 4px; font-weight: 700;">Diproses</div>
        </div>

        <div style="position: relative; z-index: 2; text-align: center;">
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${mockStatus === 'SUKSES' ? '#10b981' : 'var(--bg-input)'}; color: white; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">3</div>
          <div style="font-size: 0.72rem; color: ${mockStatus === 'SUKSES' ? '#10b981' : 'var(--text-muted)'}; margin-top: 4px; font-weight: 700;">Sukses</div>
        </div>
      </div>

      <table style="width: 100%; font-size: 0.85rem; color: var(--text-secondary);">
        <tr style="height: 28px;">
          <td>Game:</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-main);">${mockGame}</td>
        </tr>
        <tr style="height: 28px;">
          <td>Target Akun:</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-main);">${mockAccount}</td>
        </tr>
        <tr style="height: 28px;">
          <td>Nominal Item:</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-gold);">${mockItem}</td>
        </tr>
      </table>
    </div>
  `;
}
