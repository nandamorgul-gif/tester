/**
 * MORGUL Store Data Management
 * Includes game items, payment methods, promos, flash sales, and nickname mockups.
 */

const MORGUL_DATA = {
  categories: [
    { id: 'all', name: '🔥 Semua Game', icon: 'fa-fire' },
    { id: 'popular', name: '⭐ Populer', icon: 'fa-star' },
    { id: 'mobile', name: '📱 Mobile Games', icon: 'fa-mobile-screen-button' },
    { id: 'pc', name: '💻 PC Games', icon: 'fa-desktop' },
    { id: 'voucher', name: '🎟️ Voucher Code', icon: 'fa-ticket' },
    { id: 'entertainment', name: '🎬 Entertainment', icon: 'fa-film' }
  ],

  games: [
    {
      id: 'mlbb',
      title: 'Mobile Legends',
      publisher: 'Moonton',
      category: ['popular', 'mobile'],
      badge: 'PROMO 30%',
      image: 'assets/images/mlbb.png',
      hasServerId: true,
      inputGuide: 'Contoh User ID: 12345678 (2024)',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'ml_86', name: '86 Diamonds (78 + 8 Bonus)', price: 19800, originalPrice: 24000, badge: 'Popular' },
        { id: 'ml_172', name: '172 Diamonds (156 + 16 Bonus)', price: 39500, originalPrice: 48000 },
        { id: 'ml_257', name: '257 Diamonds (234 + 23 Bonus)', price: 59000, originalPrice: 72000, badge: 'Best Seller' },
        { id: 'ml_344', name: '344 Diamonds', price: 78500, originalPrice: 95000 },
        { id: 'ml_706', name: '706 Diamonds (625 + 81 Bonus)', price: 158000, originalPrice: 190000, badge: 'Bonus 12%' },
        { id: 'ml_2195', name: '2195 Diamonds (1860 + 335 Bonus)', price: 485000, originalPrice: 580000 },
        { id: 'ml_weekly', name: 'Weekly Diamond Pass (WDP)', price: 27500, originalPrice: 32000, badge: 'Hemat 60%' },
        { id: 'ml_twoweekly', name: '2x Weekly Diamond Pass', price: 54500, originalPrice: 64000 }
      ]
    },
    {
      id: 'valorant',
      title: 'Valorant Points',
      publisher: 'Riot Games',
      category: ['popular', 'pc'],
      badge: 'FLASH SALE',
      image: 'assets/images/valorant.png',
      hasServerId: false,
      inputGuide: 'Riot ID (Contoh: Morgul#MYR atau Player#1337)',
      processTime: 'Instant 1-5 Detik',
      nominals: [
        { id: 'vp_300', name: '300 Valorant Points', price: 34500, originalPrice: 40000 },
        { id: 'vp_625', name: '625 Valorant Points', price: 69000, originalPrice: 80000, badge: 'Popular' },
        { id: 'vp_1125', name: '1.125 Valorant Points', price: 124000, originalPrice: 145000 },
        { id: 'vp_1650', name: '1.650 Valorant Points', price: 178000, originalPrice: 200000, badge: 'Best Value' },
        { id: 'vp_3400', name: '3.400 Valorant Points', price: 355000, originalPrice: 410000 },
        { id: 'vp_7000', name: '7.000 Valorant Points', price: 699000, originalPrice: 800000, badge: 'Bonus 500 VP' }
      ]
    },
    {
      id: 'pb',
      title: 'Point Blank (PB Cash)',
      publisher: 'Zepetto',
      category: ['popular', 'pc'],
      badge: 'PROMO PC',
      image: 'assets/images/pb.png',
      hasServerId: false,
      inputGuide: 'ID Akun Point Blank (Contoh: morgulpb123)',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'pb_1200', name: '1.200 PB Cash', price: 10500, originalPrice: 12000 },
        { id: 'pb_2400', name: '2.400 PB Cash', price: 20500, originalPrice: 24000, badge: 'Popular' },
        { id: 'pb_6000', name: '6.000 PB Cash', price: 50500, originalPrice: 60000, badge: 'Best Seller' },
        { id: 'pb_12000', name: '12.000 PB Cash', price: 99500, originalPrice: 120000, badge: 'Bonus Cash' },
        { id: 'pb_24000', name: '24.000 PB Cash', price: 198000, originalPrice: 240000 },
        { id: 'pb_36000', name: '36.000 PB Cash', price: 295000, originalPrice: 360000, badge: 'Hemat 20%' },
        { id: 'pb_60000', name: '60.000 PB Cash', price: 490000, originalPrice: 600000, badge: 'Jumbo Pack' }
      ]
    },
    {
      id: 'genshin',
      title: 'Genshin Impact',
      publisher: 'HoYoverse',
      category: ['popular', 'mobile', 'pc'],
      badge: 'BONUS 2X',
      image: 'assets/images/genshin.png',
      hasServerId: true,
      inputGuide: 'UID (Contoh: 801234567) & Pilih Server',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'gi_welkin', name: 'Blessing of the Welkin Moon', price: 64000, originalPrice: 79000, badge: 'Rekomendasi' },
        { id: 'gi_60', name: '60 Genesis Crystals', price: 15500, originalPrice: 19000 },
        { id: 'gi_300', name: '300+30 Genesis Crystals', price: 74000, originalPrice: 89000 },
        { id: 'gi_980', name: '980+110 Genesis Crystals', price: 235000, originalPrice: 269000, badge: 'Best Seller' },
        { id: 'gi_1980', name: '1980+260 Genesis Crystals', price: 469000, originalPrice: 520000 },
        { id: 'gi_3280', name: '3280+600 Genesis Crystals', price: 779000, originalPrice: 890000 }
      ]
    },
    {
      id: 'ff',
      title: 'Free Fire',
      publisher: 'Garena',
      category: ['popular', 'mobile'],
      badge: 'PROMO 50%',
      image: 'assets/images/ff.png',
      hasServerId: false,
      inputGuide: 'Player ID (Contoh: 123456789)',
      processTime: 'Instant 1 Detik',
      nominals: [
        { id: 'ff_50', name: '50 Diamonds', price: 7500, originalPrice: 10000 },
        { id: 'ff_140', name: '140 Diamonds', price: 19500, originalPrice: 25000, badge: 'Popular' },
        { id: 'ff_355', name: '355 Diamonds', price: 48000, originalPrice: 60000 },
        { id: 'ff_720', name: '720 Diamonds', price: 95000, originalPrice: 115000, badge: 'Best Seller' },
        { id: 'ff_weekly', name: 'Membership Mingguan', price: 28000, originalPrice: 35000 }
      ]
    },
    {
      id: 'pubgm',
      title: 'PUBG Mobile',
      publisher: 'Tencent Games',
      category: ['mobile'],
      badge: 'FAST 24/7',
      image: 'assets/images/pubg.png',
      hasServerId: false,
      inputGuide: 'Character ID (Contoh: 512345678)',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'pubg_60', name: '60 Unknown Cash (UC)', price: 14500, originalPrice: 17000 },
        { id: 'pubg_325', name: '325 Unknown Cash (UC)', price: 74000, originalPrice: 85000, badge: 'Popular' },
        { id: 'pubg_660', name: '660 Unknown Cash (UC)', price: 145000, originalPrice: 170000 }
      ]
    },
    {
      id: 'hok',
      title: 'Honor of Kings',
      publisher: 'Level Infinite',
      category: ['mobile'],
      badge: 'NEW GAME',
      image: 'assets/images/hok.png',
      hasServerId: false,
      inputGuide: 'Player ID / UID',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'hok_80', name: '80 Tokens (+8 Bonus)', price: 15000, originalPrice: 18000 },
        { id: 'hok_240', name: '240 Tokens (+24 Bonus)', price: 44000, originalPrice: 52000, badge: 'Popular' },
        { id: 'hok_400', name: '400 Tokens (+40 Bonus)', price: 73000, originalPrice: 88000 }
      ]
    },
    {
      id: 'steam',
      title: 'Steam Wallet IDR',
      publisher: 'Valve',
      category: ['voucher', 'pc'],
      badge: 'KODE RESMI',
      image: 'assets/images/valorant.png',
      hasServerId: false,
      inputGuide: 'Nomor WhatsApp untuk Terima Kode',
      processTime: 'Instant 1 Detik',
      nominals: [
        { id: 'steam_45k', name: 'Steam Wallet IDR 45.000', price: 48500, originalPrice: 55000 },
        { id: 'steam_90k', name: 'Steam Wallet IDR 90.000', price: 96500, originalPrice: 110000, badge: 'Best Seller' },
        { id: 'steam_225k', name: 'Steam Wallet IDR 225.000', price: 239000, originalPrice: 260000 }
      ]
    },
    {
      id: 'netflix',
      title: 'Netflix Gift Card',
      publisher: 'Netflix Inc',
      category: ['entertainment', 'voucher'],
      badge: 'INSTANT CODE',
      image: 'assets/images/netflix.png',
      hasServerId: false,
      inputGuide: 'Nomor WhatsApp Kirim Kode',
      processTime: 'Instant 1-3 Detik',
      nominals: [
        { id: 'net_50k', name: 'Netflix Voucher IDR 50.000', price: 52000, originalPrice: 60000 },
        { id: 'net_100k', name: 'Netflix Voucher IDR 100.000', price: 104000, originalPrice: 120000 }
      ]
    }
  ],

  paymentMethods: [
    {
      category: 'Saldo Wallet Member',
      items: [
        { id: 'wallet', name: 'Saldo Wallet MORGUL', fee: 0, icon: 'fa-coins', tag: 'Instant & Bebas Admin' }
      ]
    },
    {
      category: 'QRIS & Instant',
      items: [
        { id: 'qris', name: 'QRIS (Semua E-Wallet & Bank)', fee: 0, icon: 'fa-qrcode', tag: 'Bebas Admin' }
      ]
    },
    {
      category: 'E-Wallet',
      items: [
        { id: 'dana', name: 'DANA', fee: 1000, icon: 'fa-wallet', tag: 'Instant' },
        { id: 'gopay', name: 'GoPay', fee: 1000, icon: 'fa-wallet', tag: 'Instant' },
        { id: 'ovo', name: 'OVO', fee: 1000, icon: 'fa-wallet', tag: 'Instant' },
        { id: 'shopeepay', name: 'ShopeePay', fee: 1000, icon: 'fa-wallet', tag: 'Instant' }
      ]
    },
    {
      category: 'Virtual Account Bank',
      items: [
        { id: 'bca', name: 'BCA Virtual Account', fee: 2500, icon: 'fa-building-columns', tag: 'Otomatis' },
        { id: 'mandiri', name: 'Mandiri Virtual Account', fee: 2500, icon: 'fa-building-columns', tag: 'Otomatis' },
        { id: 'bri', name: 'BRI Virtual Account', fee: 2500, icon: 'fa-building-columns', tag: 'Otomatis' },
        { id: 'bni', name: 'BNI Virtual Account', fee: 2500, icon: 'fa-building-columns', tag: 'Otomatis' }
      ]
    },
    {
      category: 'Minimarket',
      items: [
        { id: 'alfamart', name: 'Alfamart / Alfamidi', fee: 3500, icon: 'fa-store', tag: 'Kasir' },
        { id: 'indomaret', name: 'Indomaret', fee: 3500, icon: 'fa-store', tag: 'Kasir' }
      ]
    }
  ],

  promoCodes: {
    'MORGULNEW': { discountPercent: 10, maxDiscount: 15000, desc: 'Diskon 10% Pengguna Baru' },
    'DIAMOND50': { discountAmount: 5000, desc: 'Potongan Rp 5.000 All Game' },
    'MORGULPRO': { discountPercent: 15, maxDiscount: 25000, desc: 'Diskon 15% Spesial Member' }
  },

  flashSales: [
    { gameId: 'mlbb', nominalId: 'ml_257', title: '257 Diamonds MLBB', price: 49000, originalPrice: 72000, percent: 32, sold: 82 },
    { gameId: 'valorant', nominalId: 'vp_1125', title: '1.125 Valorant Points', price: 99000, originalPrice: 145000, percent: 31, sold: 94 },
    { gameId: 'genshin', nominalId: 'gi_welkin', title: 'Welkin Moon Genshin', price: 49900, originalPrice: 79000, percent: 37, sold: 76 },
    { gameId: 'ff', nominalId: 'ff_355', title: '355 Diamonds Free Fire', price: 35000, originalPrice: 60000, percent: 41, sold: 89 }
  ],

  mockNicknames: {
    '12345678': 'MorgulSlayer#1337',
    '87654321': 'NightStalker_99',
    '99999999': 'ViperMain',
    '801234567': 'TravelerPaimon',
    '512345678': 'PubgProGamer'
  },

  faqs: [
    {
      q: 'Berapa lama proses top-up di MORGUL STORE?',
      a: 'Proses top-up dilakukan secara otomatis 24 jam nonstop dan langsung masuk ke akun game Anda dalam waktu 1-3 detik setelah pembayaran terverifikasi.'
    },
    {
      q: 'Apakah top-up di MORGUL STORE aman dan legal?',
      a: 'Sangat aman dan 100% legal. Semua diamond/voucher kami bersumber langsung dari publisher resmi game (Moonton, Riot Games, Garena, HoYoverse).'
    },
    {
      q: 'Bagaimana jika saldo belum masuk?',
      a: 'Jika dalam waktu 5 menit saldo belum terisi, Anda dapat menghubungi Customer Service WhatsApp kami 24/7 dengan menyebutkan Nomor Invoice Anda.'
    },
    {
      q: 'Metode pembayaran apa saja yang didukung?',
      a: 'Kami mendukung QRIS (bebas admin), E-Wallet (DANA, OVO, GoPay, ShopeePay), Virtual Account Bank (BCA, Mandiri, BRI, BNI), dan Minimarket (Alfamart & Indomaret).'
    }
  ]
};
