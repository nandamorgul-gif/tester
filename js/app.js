/**
 * MORGUL Store - Application Controller & Dynamic UI Interactions
 */

let selectedGame = null;
let selectedNominal = null;
let selectedPayment = null;
let appliedPromo = null;

document.addEventListener('DOMContentLoaded', () => {
  initCategories();
  renderGames('all');
  initSearch();
  initFlashSale();
  initTicker();
  initFaq();
});

// Category Tab Switching
function initCategories() {
  const container = document.getElementById('categoryTabs');
  if (!container) return;

  container.innerHTML = MORGUL_DATA.categories.map(cat => `
    <button class="tab-btn ${cat.id === 'all' ? 'active' : ''}" onclick="switchCategory('${cat.id}', this)">
      <i class="fa-solid ${cat.icon}"></i> ${cat.name}
    </button>
  `).join('');
}

function switchCategory(catId, btnEl) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  renderGames(catId);
}

// Render Games Grid
function renderGames(catId, searchQuery = '') {
  const grid = document.getElementById('gameGrid');
  if (!grid) return;

  let filtered = MORGUL_DATA.games;
  if (catId !== 'all') {
    filtered = filtered.filter(g => g.category.includes(catId));
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(g => 
      g.title.toLowerCase().includes(q) || 
      g.publisher.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fa-solid fa-ghost" style="font-size: 2.5rem; margin-bottom: 0.75rem;"></i>
        <p>Game yang Anda cari tidak ditemukan.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(game => `
    <div class="game-card" onclick="openTopUpModal('${game.id}')">
      <div class="game-img-wrapper">
        <img src="${game.image}" alt="${game.title}" class="game-img" onerror="this.src='assets/images/logo.png'">
        <span class="game-tag-badge">${game.badge}</span>
      </div>
      <div class="game-info">
        <span class="game-publisher">${game.publisher}</span>
        <h4 class="game-title">${game.title}</h4>
        <span class="game-process-time"><i class="fa-solid fa-bolt"></i> ${game.processTime}</span>
      </div>
    </div>
  `).join('');
}

// Live Search Filter
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const activeTab = document.querySelector('.tab-btn.active');
    const catId = activeTab ? activeTab.getAttribute('onclick').match(/'([^']+)'/)[1] : 'all';
    renderGames(catId, e.target.value);
  });
}

// Flash Sale Countdown & Render
function initFlashSale() {
  const grid = document.getElementById('flashSaleGrid');
  if (!grid) return;

  grid.innerHTML = MORGUL_DATA.flashSales.map(item => `
    <div class="flash-card" onclick="openTopUpModal('${item.gameId}')">
      <span class="flash-badge">-${item.percent}%</span>
      <span class="flash-game-name">${item.gameId.toUpperCase()}</span>
      <div class="flash-item-title">${item.title}</div>
      <div class="flash-price-box">
        <span class="flash-price">Rp ${item.price.toLocaleString('id-ID')}</span>
        <span class="flash-old-price">Rp ${item.originalPrice.toLocaleString('id-ID')}</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${item.sold}%;"></div>
      </div>
      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: flex; justify-content: space-between;">
        <span>Terjual: ${item.sold}%</span>
        <span>Stok Terbatas</span>
      </div>
    </div>
  `).join('');

  // Start Flash Timer
  let secondsLeft = 14400; // 4 Hours
  setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) secondsLeft = 14400;

    const hrs = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
    const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');

    const timerEl = document.getElementById('flashTimer');
    if (timerEl) timerEl.innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Live Ticker Notification
function initTicker() {
  const tickerEl = document.getElementById('tickerMessage');
  if (!tickerEl) return;

  const names = ['0812****891', '0857****124', '0896****492', '0813****902', '0821****551'];
  const items = ['86 Diamonds MLBB', '625 Valorant Points', 'Welkin Moon Genshin', '355 Diamonds FF', 'Weekly Pass MLBB'];
  const times = ['3 detik lalu', '7 detik lalu', '12 detik lalu', '1 detik lalu', '5 detik lalu'];

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % names.length;
    tickerEl.innerHTML = `🔥 <strong>${names[idx]}</strong> baru saja membeli <strong>${items[idx]}</strong> (${times[idx]}) - <span style="color:#10b981;">SUKSES</span>`;
  }, 4000);
}

// FAQ Accordion Toggle
function initFaq() {
  const container = document.getElementById('faqContainer');
  if (!container) return;

  container.innerHTML = MORGUL_DATA.faqs.map(faq => `
    <div class="faq-item" onclick="this.classList.toggle('active')">
      <div class="faq-question">
        <span>${faq.q}</span>
        <i class="fa-solid fa-chevron-down"></i>
      </div>
      <div class="faq-answer">${faq.a}</div>
    </div>
  `).join('');
}

// Open & Initialize Top-Up Modal
function openTopUpModal(gameId) {
  selectedGame = MORGUL_DATA.games.find(g => g.id === gameId);
  if (!selectedGame) return;

  selectedNominal = null;
  selectedPayment = null;
  appliedPromo = null;

  const modal = document.getElementById('topupModal');
  const title = document.getElementById('topupModalTitle');
  const body = document.getElementById('topupModalBody');

  title.innerHTML = `<img src="${selectedGame.image}" style="height: 28px; width: 28px; object-fit: cover; border-radius: 6px;" onerror="this.src='assets/images/logo.png'"> Top-Up ${selectedGame.title}`;

  body.innerHTML = `
    <!-- Step 1: User Account ID -->
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">1</span>
        <span class="step-title">Masukkan Data Akun Game</span>
      </div>
      <div class="form-row ${selectedGame.hasServerId ? 'two-cols' : ''}">
        <div class="form-group">
          <label class="form-label">${selectedGame.inputGuide}</label>
          <input type="text" id="userIdInput" class="form-control" placeholder="Masukkan ID / UID">
        </div>
        ${selectedGame.hasServerId ? `
          <div class="form-group">
            <label class="form-label">Zone / Server ID</label>
            <input type="text" id="serverIdInput" class="form-control" placeholder="Zone ID (e.g. 2024)">
          </div>
        ` : ''}
      </div>
      <button type="button" class="btn-verify-id" onclick="verifyNickname()">
        <i class="fa-solid fa-magnifying-glass"></i> Cek Nickname Player
      </button>
      <div id="nicknameResult" class="nickname-result"></div>
    </div>

    <!-- Step 2: Select Nominal -->
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">2</span>
        <span class="step-title">Pilih Nominal Top-Up</span>
      </div>
      <div class="nominal-grid">
        ${selectedGame.nominals.map(nom => `
          <div class="nominal-card" onclick="selectNominal('${nom.id}', this)">
            ${nom.badge ? `<span class="nominal-badge">${nom.badge}</span>` : ''}
            <div class="nominal-title">${nom.name}</div>
            <div class="nominal-price">Rp ${nom.price.toLocaleString('id-ID')}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Step 3: Payment Method Accordion -->
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">3</span>
        <span class="step-title">Pilih Metode Pembayaran</span>
      </div>
      ${MORGUL_DATA.paymentMethods.map(group => `
        <div class="payment-group">
          <div class="payment-group-title">${group.category}</div>
          <div class="payment-grid">
            ${group.items.map(pm => `
              <div class="payment-card" onclick="selectPayment('${pm.id}', ${pm.fee}, this)">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <i class="fa-solid ${pm.icon}" style="color: var(--accent-cyan);"></i>
                  <span style="font-size: 0.65rem; color: var(--accent-purple); font-weight: 700;">${pm.tag}</span>
                </div>
                <div class="payment-name">${pm.name}</div>
                <div class="payment-fee">${pm.fee === 0 ? 'Bebas Admin' : '+Biaya Rp ' + pm.fee.toLocaleString('id-ID')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Step 4: Promo & Contact -->
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">4</span>
        <span class="step-title">Kode Promo & Kontak (WhatsApp)</span>
      </div>
      <div class="form-group" style="margin-bottom: 1rem;">
        <label class="form-label">Kode Voucher / Promo (Opsional)</label>
        <div class="promo-box">
          <input type="text" id="promoInput" class="form-control" placeholder="Contoh: MORGULNEW" style="text-transform: uppercase;">
          <button type="button" class="btn-promo-apply" onclick="applyPromo()">Gunakan</button>
        </div>
        <div id="promoMessage" style="font-size: 0.8rem; margin-top: 4px;"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Nomor WhatsApp (Untuk Struk Bukti Transaksi)</label>
        <input type="tel" id="waInput" class="form-control" placeholder="0812xxxxxxxx" value="081298765432">
      </div>
    </div>

    <!-- Bottom Action Bar -->
    <div class="bottom-checkout-bar">
      <div>
        <div class="total-label">Total Pembayaran:</div>
        <div class="total-amount" id="displayTotal">Rp 0</div>
      </div>
      <button class="btn-submit-order" onclick="processCheckout()">
        Beli Sekarang <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  `;

  modal.classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// Nickname Check Simulator
function verifyNickname() {
  const userId = document.getElementById('userIdInput')?.value.trim();
  const resEl = document.getElementById('nicknameResult');
  if (!resEl) return;

  if (!userId) {
    resEl.style.display = 'block';
    resEl.style.color = '#ef4444';
    resEl.style.borderColor = '#ef4444';
    resEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
    resEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Masukkan User ID terlebih dahulu!';
    return;
  }

  const foundNick = MORGUL_DATA.mockNicknames[userId] || `MorgulPlayer_${userId.slice(-4)}`;
  resEl.style.display = 'block';
  resEl.style.color = '#10b981';
  resEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
  resEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
  resEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Nickname Terdeteksi: <strong>${foundNick}</strong>`;
}

// Selection Handlers
function selectNominal(nomId, el) {
  document.querySelectorAll('.nominal-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  selectedNominal = selectedGame.nominals.find(n => n.id === nomId);
  updateTotalDisplay();
}

function selectPayment(pmId, fee, el) {
  document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  selectedPayment = { id: pmId, fee: fee };
  updateTotalDisplay();
}

function applyPromo() {
  const input = document.getElementById('promoInput')?.value.trim().toUpperCase();
  const msgEl = document.getElementById('promoMessage');

  if (!input) return;

  if (MORGUL_DATA.promoCodes[input]) {
    appliedPromo = { code: input, ...MORGUL_DATA.promoCodes[input] };
    msgEl.style.color = '#10b981';
    msgEl.innerText = `✓ Promo Berhasil! ${appliedPromo.desc}`;
  } else {
    appliedPromo = null;
    msgEl.style.color = '#ef4444';
    msgEl.innerText = '✗ Kode Promo tidak valid atau sudah expired.';
  }
  updateTotalDisplay();
}

function calculateTotal() {
  if (!selectedNominal) return 0;

  let basePrice = selectedNominal.price;
  let fee = selectedPayment ? selectedPayment.fee : 0;
  let discount = 0;

  if (appliedPromo) {
    if (appliedPromo.discountPercent) {
      discount = Math.min((basePrice * appliedPromo.discountPercent) / 100, appliedPromo.maxDiscount || 999999);
    } else if (appliedPromo.discountAmount) {
      discount = appliedPromo.discountAmount;
    }
  }

  return Math.max(0, basePrice - discount + fee);
}

function updateTotalDisplay() {
  const total = calculateTotal();
  const display = document.getElementById('displayTotal');
  if (display) {
    display.innerText = `Rp ${total.toLocaleString('id-ID')}`;
  }
}
