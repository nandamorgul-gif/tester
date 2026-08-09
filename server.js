/**
 * MORGUL STORE - Midtrans Payment Gateway Backend Server
 * Built with standard Node.js modules for zero external dependency overhead.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Default Configuration
const CONFIG = {
  port: process.env.PORT || 3000,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY_HERE',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY_HERE',
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
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

server.listen(CONFIG.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 MORGUL Store Server listening on port ${CONFIG.port}`);
  console.log(`💳 Midtrans Mode: ${CONFIG.isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
  console.log(`🌐 Website URL: http://localhost:${CONFIG.port}`);
  console.log(`====================================================`);
});
