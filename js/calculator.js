/**
 * MORGUL Store - MLBB Winrate & Magic Wheel Calculator Tool
 */

function openCalcModal() {
  const modal = document.getElementById('calcModal');
  if (modal) modal.classList.add('active');
}

function calculateWinrate() {
  const totalMatch = parseInt(document.getElementById('calcTotalMatch')?.value) || 0;
  const currentWr = parseFloat(document.getElementById('calcCurrentWr')?.value) || 0;
  const targetWr = parseFloat(document.getElementById('calcTargetWr')?.value) || 0;
  const resEl = document.getElementById('calcWrResult');

  if (!resEl) return;

  if (totalMatch <= 0 || currentWr <= 0 || targetWr <= 0) {
    resEl.innerHTML = `<span style="color:#ef4444;">Mohon isi semua data match & winrate dengan benar!</span>`;
    return;
  }

  if (targetWr >= 100) {
    resEl.innerHTML = `<span style="color:#ef4444;">Target winrate tidak boleh mencapai 100% atau lebih!</span>`;
    return;
  }

  if (targetWr <= currentWr) {
    resEl.innerHTML = `<span style="color:#ef4444;">Target winrate harus lebih tinggi dari Winrate saat ini!</span>`;
    return;
  }

  // Formula: Win Streak Required = (TotalMatch * TargetWR - CurrentWins) / (100 - TargetWR)
  const currentWins = totalMatch * (currentWr / 100);
  const neededWins = Math.ceil((targetWr * totalMatch - 100 * currentWins) / (100 - targetWr));

  resEl.innerHTML = `
    <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid var(--accent-cyan); padding: 1rem; border-radius: 8px; text-align: center; margin-top: 1rem;">
      <div style="font-size: 0.85rem; color: var(--text-secondary);">Anda Membutuhkan Kemenangan Tanpa Kalah:</div>
      <div style="font-size: 2rem; font-weight: 800; color: var(--accent-cyan); margin: 0.25rem 0;">
        ${neededWins} <span style="font-size: 1rem;">Win Streak</span>
      </div>
      <div style="font-size: 0.78rem; color: var(--text-muted);">
        Total Match akan menjadi <strong>${totalMatch + neededWins} Match</strong> untuk mencapai <strong>${targetWr}% Winrate</strong>.
      </div>
    </div>
  `;
}

function calculateMagicWheel() {
  const currentPoints = parseInt(document.getElementById('mwPoints')?.value) || 0;
  const resEl = document.getElementById('mwResult');

  if (!resEl) return;

  if (currentPoints < 0 || currentPoints > 200) {
    resEl.innerHTML = `<span style="color:#ef4444;">Points Magic Wheel valid antara 0 - 200!</span>`;
    return;
  }

  const maxPoints = 200;
  const remainingPoints = maxPoints - currentPoints;
  const spinsNeeded = Math.ceil(remainingPoints / 5);
  const diamondNeeded = spinsNeeded * 270; // 5x Spin = 270 Diamonds (with 20% discount standard)

  resEl.innerHTML = `
    <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid var(--accent-gold); padding: 1rem; border-radius: 8px; text-align: center; margin-top: 1rem;">
      <div style="font-size: 0.85rem; color: var(--text-secondary);">Estimasi Sisa Spin Magic Wheel:</div>
      <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-gold); margin: 0.25rem 0;">
        ~${spinsNeeded * 5} Spin Magic Wheel
      </div>
      <div style="font-size: 0.88rem; color: var(--text-main); font-weight: 700;">
        Kebutuhan Diamond: ± <span style="color: var(--accent-cyan);">${diamondNeeded.toLocaleString('id-ID')} Diamonds</span>
      </div>
    </div>
  `;
}
