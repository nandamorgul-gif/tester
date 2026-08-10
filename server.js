/**
 * MORGUL STORE - Midtrans Payment Gateway Backend Server
 * Built with standard Node.js modules for zero external dependency overhead.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// Default Configuration
const CONFIG = {
  port: process.env.PORT || 3000,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY_HERE',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY_HERE',
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  providerName: process.env.PROVIDER_NAME || 'simulation', // vipreseller | digiflazz | simulation
  providerApiId: process.env.PROVIDER_API_ID || '',
  providerApiKey: process.env.PROVIDER_API_KEY || '',
  providerSignature: process.env.PROVIDER_SIGNATURE || '',
  providerMarginPercent: parseFloat(process.env.PROVIDER_MARGIN_PERCENT) || 10
};

// Load .env if present
const envPath = path.join(__dirname, '.env');
function loadEnv() {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (key === 'PORT') CONFIG.port = parseInt(value, 10) || 3000;
        if (key === 'MIDTRANS_SERVER_KEY') CONFIG.serverKey = value;
        if (key === 'MIDTRANS_CLIENT_KEY') CONFIG.clientKey = value;
        if (key === 'MIDTRANS_IS_PRODUCTION') CONFIG.isProduction = value === 'true';
        if (key === 'PROVIDER_NAME') CONFIG.providerName = value;
        if (key === 'PROVIDER_API_ID') CONFIG.providerApiId = value;
        if (key === 'PROVIDER_API_KEY') CONFIG.providerApiKey = value;
        if (key === 'PROVIDER_SIGNATURE') CONFIG.providerSignature = value;
        if (key === 'PROVIDER_MARGIN_PERCENT') CONFIG.providerMarginPercent = parseFloat(value) || 10;
      }
    });
  }
}
loadEnv();

function saveEnv() {
  const envContent = `# MORGUL Store - Midtrans Configuration
PORT=${CONFIG.port}
MIDTRANS_SERVER_KEY=${CONFIG.serverKey}
MIDTRANS_CLIENT_KEY=${CONFIG.clientKey}
MIDTRANS_IS_PRODUCTION=${CONFIG.isProduction}

# Game Top Up Provider Configuration
PROVIDER_NAME=${CONFIG.providerName}
PROVIDER_API_ID=${CONFIG.providerApiId}
PROVIDER_API_KEY=${CONFIG.providerApiKey}
PROVIDER_SIGNATURE=${CONFIG.providerSignature}
PROVIDER_MARGIN_PERCENT=${CONFIG.providerMarginPercent}
`;
  fs.writeFileSync(envPath, envContent, 'utf8');
}

// In-Memory Database for Transactions
const transactionsDB = new Map();

// Helper MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// Create HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API Endpoints
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      clientKey: CONFIG.clientKey,
      isProduction: CONFIG.isProduction,
      hasServerKey: CONFIG.serverKey && CONFIG.serverKey !== 'SB-Mid-server-YOUR_SERVER_KEY_HERE'
    }));
    return;
  }

  if (pathname === '/api/config' && req.method === 'POST') {
    parseRequestBody(req, (data) => {
      if (data.serverKey) CONFIG.serverKey = data.serverKey;
      if (data.clientKey) CONFIG.clientKey = data.clientKey;
      if (data.isProduction !== undefined) CONFIG.isProduction = Boolean(data.isProduction);

      saveEnv();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Konfigurasi Midtrans berhasil disimpan!',
        clientKey: CONFIG.clientKey,
        isProduction: CONFIG.isProduction
      }));
    });
    return;
  }

  // Provider API Config Endpoint
  if (pathname === '/api/provider/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      providerName: CONFIG.providerName,
      providerApiId: CONFIG.providerApiId,
      hasApiKey: Boolean(CONFIG.providerApiKey),
      hasSignature: Boolean(CONFIG.providerSignature),
      providerMarginPercent: CONFIG.providerMarginPercent
    }));
    return;
  }

  if (pathname === '/api/provider/config' && req.method === 'POST') {
    parseRequestBody(req, (data) => {
      if (data.providerName) CONFIG.providerName = data.providerName;
      if (data.providerApiId !== undefined) CONFIG.providerApiId = data.providerApiId;
      if (data.providerApiKey !== undefined) CONFIG.providerApiKey = data.providerApiKey;
      if (data.providerSignature !== undefined) CONFIG.providerSignature = data.providerSignature;
      if (data.providerMarginPercent !== undefined) CONFIG.providerMarginPercent = parseFloat(data.providerMarginPercent) || 10;

      saveEnv();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Konfigurasi Provider Top-Up berhasil disimpan!',
        providerName: CONFIG.providerName,
        providerMarginPercent: CONFIG.providerMarginPercent
      }));
    });
    return;
  }

  // Provider Cek Saldo
  if (pathname === '/api/provider/balance' && req.method === 'GET') {
    getProviderBalance().then(result => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
    });
    return;
  }

  // Provider Cek Nickname Player
  if (pathname === '/api/provider/check-nickname' && req.method === 'POST') {
    parseRequestBody(req, (body) => {
      const { gameCode, targetId, zoneId } = body;
      checkProviderNickname(gameCode, targetId, zoneId).then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      }).catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      });
    });
    return;
  }

  // Provider Process Order
  if (pathname === '/api/provider/order' && req.method === 'POST') {
    parseRequestBody(req, (body) => {
      processProviderOrder(body).then(result => {
        // Save SN into transaction DB if available
        if (body.orderId && transactionsDB.has(body.orderId)) {
          const tx = transactionsDB.get(body.orderId);
          tx.serialNumber = result.serialNumber;
          tx.status = result.status || 'SUKSES';
          transactionsDB.set(body.orderId, tx);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      }).catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      });
    });
    return;
  }

  // Generate Midtrans Snap Token
  if (pathname === '/api/midtrans/token' && req.method === 'POST') {
    parseRequestBody(req, (body) => {
      const { orderId, totalPay, gameTitle, itemName, userAccount, paymentMethod, waNumber } = body;

      if (!orderId || !totalPay) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Data pesanan tidak lengkap' }));
        return;
      }

      // Check if Midtrans Server Key is default placeholder
      const isPlaceholderKey = !CONFIG.serverKey || CONFIG.serverKey.includes('YOUR_SERVER_KEY_HERE');

      if (isPlaceholderKey) {
        // Return clear error instructions for configuring keys
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          isMock: true,
          message: 'Server Key Midtrans belum dikonfigurasi. Silakan atur Server Key di Dashboard Admin.',
          token: null
        }));
        return;
      }

      // Build Midtrans Snap Transaction Payload
      const snapPayload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: Math.round(totalPay)
        },
        item_details: [
          {
            id: itemName || 'TOPUP-ITEM',
            price: Math.round(totalPay),
            quantity: 1,
            name: `${gameTitle} - ${itemName}`.substring(0, 50)
          }
        ],
        customer_details: {
          first_name: `User ${userAccount}`,
          phone: waNumber || '08123456789'
        },
        credit_card: {
          secure: true
        }
      };

      // Select Midtrans Snap Endpoint
      const host = CONFIG.isProduction
        ? 'app.midtrans.com'
        : 'app.sandbox.midtrans.com';

      const authHeader = 'Basic ' + Buffer.from(CONFIG.serverKey + ':').toString('base64');
      const postData = JSON.stringify(snapPayload);

      const options = {
        hostname: host,
        port: 443,
        path: '/snap/v1/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const snapReq = https.request(options, (snapRes) => {
        let resData = '';
        snapRes.on('data', (chunk) => resData += chunk);
        snapRes.on('end', () => {
          try {
            const parsed = JSON.parse(resData);
            if (snapRes.statusCode >= 200 && snapRes.statusCode < 300 && parsed.token) {
              // Store transaction in memory DB
              transactionsDB.set(orderId, {
                orderId,
                status: 'MENUNGGU PEMBAYARAN',
                snapToken: parsed.token,
                redirectUrl: parsed.redirect_url,
                createdAt: new Date().toISOString()
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                token: parsed.token,
                redirect_url: parsed.redirect_url
              }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: parsed.error_messages ? parsed.error_messages.join(', ') : 'Gagal membuat transaksi Midtrans.',
                raw: parsed
              }));
            }
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Gagal memproses respon Midtrans' }));
          }
        });
      });

      snapReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Koneksi ke Midtrans gagal: ' + err.message }));
      });

      snapReq.write(postData);
      snapReq.end();
    });
    return;
  }

  // Midtrans Notification Webhook Endpoint
  if (pathname === '/api/midtrans/notification' && req.method === 'POST') {
    parseRequestBody(req, (body) => {
      const { order_id, transaction_status, fraud_status } = body;

      console.log(`[MIDTRANS NOTIFICATION] Order ID: ${order_id}, Status: ${transaction_status}`);

      let orderStatus = 'MENUNGGU PEMBAYARAN';

      if (transaction_status === 'capture') {
        if (fraud_status === 'accept') {
          orderStatus = 'SUKSES';
        }
      } else if (transaction_status === 'settlement') {
        orderStatus = 'SUKSES';
      } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
        orderStatus = 'EXPIRED';
      } else if (transaction_status === 'pending') {
        orderStatus = 'MENUNGGU PEMBAYARAN';
      }

      if (order_id && transactionsDB.has(order_id)) {
        const tx = transactionsDB.get(order_id);
        tx.status = orderStatus;
        transactionsDB.set(order_id, tx);

        // Auto trigger provider top-up order when transaction becomes SUKSES
        if (orderStatus === 'SUKSES') {
          processProviderOrder({
            orderId: tx.orderId,
            gameTitle: tx.gameTitle,
            itemName: tx.itemName,
            userAccount: tx.userAccount,
            waNumber: tx.waNumber
          }).then(res => {
            console.log(`[PROVIDER AUTO-ORDER] Order ${tx.orderId} processed: ${res.serialNumber || res.message}`);
          }).catch(err => {
            console.error(`[PROVIDER AUTO-ORDER ERROR] Order ${tx.orderId}: ${err.message}`);
          });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: orderStatus }));
    });
    return;
  }

  // Serve Static Files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const extname = String(path.extname(filePath)).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

function parseRequestBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body || '{}'));
    } catch (e) {
      callback({});
    }
  });
}

// Provider API Integration Handlers
async function getProviderBalance() {
  if (CONFIG.providerName === 'simulation' || !CONFIG.providerApiKey) {
    return { success: true, isSimulation: true, balance: 5000000, provider: 'Simulasi Testing', message: 'Saldo Simulasi Mode: Rp 5.000.000' };
  }

  if (CONFIG.providerName === 'vipreseller') {
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey).digest('hex');
    const postData = new url.URLSearchParams({
      key: CONFIG.providerApiKey,
      sign: sign
    }).toString();

    return new Promise((resolve) => {
      const options = {
        hostname: 'vip-reseller.co.id',
        port: 443,
        path: '/api/profile',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.result && parsed.data) {
              resolve({ success: true, balance: parsed.data.balance || 0, provider: 'VIP Reseller', raw: parsed });
            } else {
              resolve({ success: false, message: parsed.message || 'Gagal mengambil saldo VIP Reseller' });
            }
          } catch (e) {
            resolve({ success: false, message: 'Format respon VIP Reseller tidak valid' });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, message: err.message }));
      req.write(postData);
      req.end();
    });
  }

  if (CONFIG.providerName === 'digiflazz') {
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey + 'depo').digest('hex');
    const payload = JSON.stringify({ cmd: 'deposit', username: CONFIG.providerApiId, sign: sign });

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.digiflazz.com',
        port: 443,
        path: '/v1/cek-saldo',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.deposit !== undefined) {
              resolve({ success: true, balance: parsed.data.deposit || 0, provider: 'Digiflazz', raw: parsed });
            } else {
              resolve({ success: false, message: parsed.data ? parsed.data.message : 'Gagal mengambil saldo Digiflazz' });
            }
          } catch (e) {
            resolve({ success: false, message: 'Format respon Digiflazz tidak valid' });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, message: err.message }));
      req.write(payload);
      req.end();
    });
  }

  return { success: false, message: 'Provider tidak dikenal' };
}

async function checkProviderNickname(gameCode, targetId, zoneId) {
  if (CONFIG.providerName === 'simulation' || !CONFIG.providerApiKey) {
    const mockNames = {
      '12345678': 'MorgulSlayer#1337',
      '87654321': 'NightStalker_99',
      '99999999': 'ViperMain',
      '801234567': 'TravelerPaimon',
      '512345678': 'PubgProGamer'
    };
    const nickname = mockNames[targetId] || `MorgulPlayer_${targetId.slice(-4)}`;
    return { success: true, nickname: nickname, isSimulation: true };
  }

  if (CONFIG.providerName === 'vipreseller') {
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey).digest('hex');
    const postData = new url.URLSearchParams({
      key: CONFIG.providerApiKey,
      sign: sign,
      type: 'get-nickname',
      code: gameCode || 'mobile-legends',
      target: targetId,
      additional_target: zoneId || ''
    }).toString();

    return new Promise((resolve) => {
      const options = {
        hostname: 'vip-reseller.co.id',
        port: 443,
        path: '/api/game-feature',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.result && parsed.data) {
              resolve({ success: true, nickname: parsed.data.name || parsed.data, raw: parsed });
            } else {
              resolve({ success: false, message: parsed.message || 'Nickname tidak ditemukan' });
            }
          } catch (e) {
            resolve({ success: false, message: 'Gagal merespon pengecekan nickname' });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, message: err.message }));
      req.write(postData);
      req.end();
    });
  }

  if (CONFIG.providerName === 'digiflazz') {
    const refId = `INQ-${Date.now()}`;
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey + refId).digest('hex');
    const payload = JSON.stringify({
      commands: 'pln-subscribe',
      customer_no: targetId + (zoneId || ''),
      buyer_sku_code: gameCode || 'ml',
      testing: !CONFIG.isProduction,
      username: CONFIG.providerApiId,
      ref_id: refId,
      sign: sign
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.digiflazz.com',
        port: 443,
        path: '/v1/transaction',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.customer_name) {
              resolve({ success: true, nickname: parsed.data.customer_name, raw: parsed });
            } else if (parsed.data && parsed.data.sn) {
              resolve({ success: true, nickname: parsed.data.sn, raw: parsed });
            } else {
              resolve({ success: true, nickname: `Player_${targetId.slice(-4)}` });
            }
          } catch (e) {
            resolve({ success: true, nickname: `Player_${targetId.slice(-4)}` });
          }
        });
      });
      req.on('error', () => resolve({ success: true, nickname: `Player_${targetId.slice(-4)}` }));
      req.write(payload);
      req.end();
    });
  }

  return { success: true, nickname: `Player_${targetId.slice(-4)}` };
}

async function processProviderOrder(orderData) {
  const { orderId, gameTitle, itemName, userAccount, serviceCode } = orderData;
  const refId = orderId || `MORGUL-${Date.now()}`;
  const targetId = userAccount ? userAccount.split(' ')[0] : '12345678';
  const zoneId = userAccount && userAccount.includes('(') ? userAccount.split('(')[1].replace(')', '') : '';

  if (CONFIG.providerName === 'simulation' || !CONFIG.providerApiKey) {
    const sn = `SN-MORGUL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      status: 'SUKSES',
      serialNumber: sn,
      message: 'Top-Up Otomatis Berhasil (Mode Simulasi)',
      provider: 'Simulasi MORGUL API',
      refId: refId
    };
  }

  if (CONFIG.providerName === 'vipreseller') {
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey).digest('hex');
    const postData = new url.URLSearchParams({
      key: CONFIG.providerApiKey,
      sign: sign,
      type: 'order',
      service: serviceCode || 'ML86',
      target: targetId,
      additional_target: zoneId
    }).toString();

    return new Promise((resolve) => {
      const options = {
        hostname: 'vip-reseller.co.id',
        port: 443,
        path: '/api/prepaid',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.result) {
              resolve({
                success: true,
                status: parsed.data.status || 'SUKSES',
                serialNumber: parsed.data.sn || parsed.data.trxid || `SN-${parsed.data.id}`,
                message: 'Pesanan diteruskan ke VIP Reseller',
                raw: parsed
              });
            } else {
              resolve({ success: false, message: parsed.message || 'Gagal mengirim order ke VIP Reseller' });
            }
          } catch (e) {
            resolve({ success: false, message: 'Respon VIP Reseller error' });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, message: err.message }));
      req.write(postData);
      req.end();
    });
  }

  if (CONFIG.providerName === 'digiflazz') {
    const sign = crypto.createHash('md5').update(CONFIG.providerApiId + CONFIG.providerApiKey + refId).digest('hex');
    const payload = JSON.stringify({
      username: CONFIG.providerApiId,
      buyer_sku_code: serviceCode || 'ml86',
      customer_no: targetId + zoneId,
      ref_id: refId,
      sign: sign,
      testing: !CONFIG.isProduction
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.digiflazz.com',
        port: 443,
        path: '/v1/transaction',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data) {
              resolve({
                success: true,
                status: (parsed.data.status === 'Sukses' || parsed.data.rc === '00') ? 'SUKSES' : (parsed.data.status || 'PENDING'),
                serialNumber: parsed.data.sn || parsed.data.ref_id,
                message: parsed.data.message || 'Order Digiflazz berhasil diproses',
                raw: parsed
              });
            } else {
              resolve({ success: false, message: parsed.message || 'Respon Digiflazz gagal' });
            }
          } catch (e) {
            resolve({ success: false, message: 'Format respon Digiflazz tidak valid' });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, message: err.message }));
      req.write(payload);
      req.end();
    });
  }

  return { success: false, message: 'Provider tidak terkonfigurasi' };
}

server.listen(CONFIG.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 MORGUL Store Server listening on port ${CONFIG.port}`);
  console.log(`💳 Midtrans Mode: ${CONFIG.isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
  console.log(`🔌 Provider Top Up Mode: ${CONFIG.providerName.toUpperCase()}`);
  console.log(`🌐 Website URL: http://localhost:${CONFIG.port}`);
  console.log(`====================================================`);
});

