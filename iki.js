/* =============================================
   IKI.JS — Script utama toko NEXUSHOST
   ============================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/* -----------------------------------------------
   FIREBASE CONFIG — sama seperti di login.html
   ----------------------------------------------- */
const firebaseConfig = {
  apiKey:            "AIzaSyBq30K69ezDu86TewFcMtQVR7WhCes92oA",
  authDomain:        "iki-d35c9.firebaseapp.com",
  projectId:         "iki-d35c9",
  storageBucket:     "iki-d35c9.firebasestorage.app",
  messagingSenderId: "745498733905",
  appId:             "1:745498733905:web:5571e71887e21f919d3770"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const provider = new GoogleAuthProvider();

/* -----------------------------------------------
   CEK STATUS LOGIN — update settings panel otomatis
   ----------------------------------------------- */
onAuthStateChanged(auth, (user) => {
  updateSettingsUI(user);
});

function updateSettingsUI(user) {
  const nameEl    = document.getElementById('settingsName');
  const emailEl   = document.getElementById('settingsEmail');
  const avatar    = document.getElementById('settingsAvatar');
  const loginBtn  = document.getElementById('settingsLoginBtn');
  const logoutBtn = document.getElementById('settingsLogoutBtn');

  if (user) {
    nameEl.textContent  = (user.displayName || 'USER').toUpperCase();
    emailEl.textContent = user.email;
    avatar.innerHTML    = user.photoURL
      ? `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:0">`
      : (user.displayName || 'U')[0].toUpperCase();
    loginBtn.style.display  = 'none';
    logoutBtn.style.display = 'flex';
  } else {
    nameEl.textContent  = 'TAMU';
    emailEl.textContent = 'Belum login';
    avatar.innerHTML    = '?';
    loginBtn.style.display  = 'flex';
    logoutBtn.style.display = 'none';
  }
}

/* -----------------------------------------------
   LOGIN GOOGLE (dari settings panel)
   ----------------------------------------------- */
window.loginGoogle = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    updateSettingsUI(result.user);
    showToast('▸ LOGIN BERHASIL: ' + result.user.displayName);
    closeSettings();
  } catch (err) {
    showToast('⚠ Login gagal: ' + err.message);
  }
};

/* -----------------------------------------------
   LOGOUT
   ----------------------------------------------- */
window.logoutUser = async function () {
  await signOut(auth);
  updateSettingsUI(null);
  showToast('▸ BERHASIL LOGOUT');
  closeSettings();
  // redirect ke halaman login setelah 1 detik
  setTimeout(() => { window.location.href = 'index.html'; }, 1000);
};

/* -----------------------------------------------
   SETTINGS MODAL
   ----------------------------------------------- */
window.openSettings = function () {
  document.getElementById('settingsModal').classList.add('open');
};

window.closeSettings = function () {
  document.getElementById('settingsModal').classList.remove('open');
};

// tutup settings kalau klik luar panel
document.getElementById('settingsModal').addEventListener('click', function (e) {
  if (e.target === this) closeSettings();
});

/* -----------------------------------------------
   DATA PRODUK
   ----------------------------------------------- */
const products = [
  {
    id: 1,
    name: 'STARTER',
    desc: 'Cocok untuk server baru & testing',
    price: 35000,
    duration: '/bulan',
    emoji: '🟢',
    tag: 'new',
    tagLabel: 'POPULER',
    specs: ['RAM: 512 MB', 'Slot: 50 Players', 'CPU: 1 Core', 'Storage: 2 GB SSD']
  },
  {
    id: 2,
    name: 'STANDARD',
    desc: 'Untuk server roleplay ukuran sedang',
    price: 75000,
    duration: '/bulan',
    emoji: '🔵',
    tag: 'hot',
    tagLabel: 'TERLARIS',
    specs: ['RAM: 1 GB', 'Slot: 150 Players', 'CPU: 2 Core', 'Storage: 5 GB SSD']
  },
  {
    id: 3,
    name: 'ADVANCED',
    desc: 'Server RP besar dengan performa tinggi',
    price: 140000,
    duration: '/bulan',
    emoji: '🟣',
    tag: null,
    tagLabel: null,
    specs: ['RAM: 2 GB', 'Slot: 300 Players', 'CPU: 3 Core', 'Storage: 10 GB SSD']
  },
  {
    id: 4,
    name: 'ULTIMATE',
    desc: 'Performa maksimal, zero lag guaranteed',
    price: 250000,
    duration: '/bulan',
    emoji: '🔴',
    tag: null,
    tagLabel: null,
    specs: ['RAM: 4 GB', 'Slot: 500 Players', 'CPU: 4 Core', 'Storage: 20 GB SSD']
  },
  {
    id: 5,
    name: 'STARTER 3 BULAN',
    desc: 'Hemat 15% dibanding bayar bulanan',
    price: 89000,
    duration: '/3 bulan',
    emoji: '🟢',
    tag: 'sale',
    tagLabel: 'HEMAT',
    specs: ['RAM: 512 MB', 'Slot: 50 Players', 'CPU: 1 Core', 'Storage: 2 GB SSD']
  },
  {
    id: 6,
    name: 'STANDARD 3 BULAN',
    desc: 'Hemat 20% dibanding bayar bulanan',
    price: 180000,
    duration: '/3 bulan',
    emoji: '🔵',
    tag: 'sale',
    tagLabel: 'HEMAT',
    specs: ['RAM: 1 GB', 'Slot: 150 Players', 'CPU: 2 Core', 'Storage: 5 GB SSD']
  },
];

/* -----------------------------------------------
   NOMOR WA PENJUAL
   ----------------------------------------------- */
const waNumber = '6281234567890';

/* -----------------------------------------------
   STATE & HELPER
   ----------------------------------------------- */
let cart = [];

function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

/* -----------------------------------------------
   RENDER PRODUK
   ----------------------------------------------- */
function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card" style="animation-delay:${i * 0.07}s">
      <div class="product-img-wrap">
        <div style="font-size:72px">${p.emoji}</div>
        <div class="product-img-overlay"></div>
        ${p.tag ? `<div class="product-tag ${p.tag}">${p.tagLabel}</div>` : ''}
        <div class="product-id">#${String(p.id).padStart(4,'0')}</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-specs">
          ${p.specs.map(s => `<div class="product-spec">${s}</div>`).join('')}
        </div>
        <div class="product-footer">
          <div class="product-price">
            ${formatRp(p.price)}
            <small class="price-duration">${p.duration}</small>
          </div>
          <button class="add-btn" onclick="addToCart(${p.id})">ORDER</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* -----------------------------------------------
   KERANJANG
   ----------------------------------------------- */
window.addToCart = function (id) {
  const product  = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();
  showToast('▸ ' + product.name + ' ditambahkan ke cart');
};

window.changeQty = function (id, delta) {
  const idx = cart.findIndex(c => c.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  updateCartUI();
};

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const count = cart.reduce((s, c) => s + c.qty, 0);

  document.getElementById('cartCount').textContent   = count;
  document.getElementById('drawerTotal').textContent = formatRp(total);
  document.getElementById('checkoutBtn').disabled    = cart.length === 0;

  const el = document.getElementById('cartItems');
  if (cart.length === 0) {
    el.innerHTML = '<div class="cart-empty"><div>🛒</div>CART KOSONG</div>';
    return;
  }

  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatRp(item.price)} ${item.duration}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');
}

/* -----------------------------------------------
   DRAWER
   ----------------------------------------------- */
window.openCart = function () {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
};

window.closeCart = function () {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
};

/* -----------------------------------------------
   CHECKOUT
   ----------------------------------------------- */
window.openCheckout = function () {
  closeCart();
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('orderTotal').textContent = formatRp(total);
  document.getElementById('orderSummaryItems').innerHTML = cart.map(item => `
    <div class="order-item">
      <span class="order-item-name">${item.emoji} ${item.name} ×${item.qty} ${item.duration}</span>
      <span class="order-item-total">${formatRp(item.price * item.qty)}</span>
    </div>
  `).join('');
  document.getElementById('checkoutPage').classList.add('open');
};

window.closeCheckout = function () {
  document.getElementById('checkoutPage').classList.remove('open');
  openCart();
};

window.submitOrder = function () {
  const nama    = document.getElementById('inputNama').value.trim();
  const wa      = document.getElementById('inputWA').value.trim();
  const email   = document.getElementById('inputEmail').value.trim();
  const server  = document.getElementById('inputServer').value.trim();
  const catatan = document.getElementById('inputCatatan').value.trim();

  if (!nama) { showToast('⚠ Nama tidak boleh kosong');     return; }
  if (!wa)   { showToast('⚠ Nomor WA tidak boleh kosong'); return; }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

  let msg = `🎮 *ORDER NEXUSHOST — SA-MP HOSTING*\n\n`;
  msg += `👤 *Nama:* ${nama}\n`;
  msg += `📱 *WA:* ${wa}\n`;
  if (email)   msg += `📧 *Email:* ${email}\n`;
  if (server)  msg += `🖥️ *Nama Server:* ${server}\n`;
  if (catatan) msg += `📝 *Catatan:* ${catatan}\n`;
  msg += `\n*Detail Paket:*\n`;
  cart.forEach(item => {
    msg += `• ${item.emoji} ${item.name} ×${item.qty} (${item.duration.replace('/','')})\n`;
    msg += `  ${item.specs.join(' | ')}\n`;
    msg += `  = ${formatRp(item.price * item.qty)}\n`;
  });
  msg += `\n💰 *TOTAL: ${formatRp(total)}*\n`;
  msg += `\n_Mohon segera konfirmasi & kirim bukti pembayaran._`;

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

  // simpan riwayat order
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push({ nama: cart.map(c => c.name).join(', '), total: formatRp(total), waktu: new Date().toLocaleDateString('id-ID') });
  localStorage.setItem('orders', JSON.stringify(orders));

  document.getElementById('successText').innerHTML =
    `Server <strong style="color:var(--cyan)">${server || nama}</strong> akan diaktivasi dalam 5 menit setelah pembayaran dikonfirmasi.`;
  document.getElementById('waBtn').onclick = () => window.open(waUrl, '_blank');
  document.getElementById('checkoutPage').classList.remove('open');
  document.getElementById('successPage').classList.add('open');
};

/* -----------------------------------------------
   RESET
   ----------------------------------------------- */
window.backToHome = function () {
  cart = [];
  updateCartUI();
  document.getElementById('successPage').classList.remove('open');
  ['inputNama','inputWA','inputEmail','inputServer','inputCatatan']
    .forEach(id => document.getElementById(id).value = '');
};

/* -----------------------------------------------
   TOAST
   ----------------------------------------------- */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* -----------------------------------------------
   INIT
   ----------------------------------------------- */
renderProducts();

/* -----------------------------------------------
   PROFIL
   ----------------------------------------------- */
window.openProfil = function () {
  const user = auth.currentUser;
  if (!user) {
    showToast('⚠ Login dulu untuk lihat profil');
    return;
  }

  // isi data
  const avatar   = document.getElementById('profilAvatar');
  const badge    = document.getElementById('profilBadge');
  const joined   = document.getElementById('profilJoined');

  document.getElementById('profilName').textContent   = (user.displayName || 'USER').toUpperCase();
  document.getElementById('profilName2').textContent  = user.displayName || '-';
  document.getElementById('profilEmail').textContent  = user.email;
  document.getElementById('profilEmail2').textContent = user.email;
  badge.textContent = '● ONLINE';
  badge.style.color = 'var(--green)';

  avatar.innerHTML = user.photoURL
    ? `<img src="${user.photoURL}">`
    : (user.displayName || 'U')[0].toUpperCase();

  // tanggal bergabung
  if (user.metadata?.creationTime) {
    const d = new Date(user.metadata.creationTime);
    joined.textContent = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  }

  // riwayat order dari localStorage
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const orderEl = document.getElementById('profilOrders');
  if (orders.length === 0) {
    orderEl.innerHTML = `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);text-align:center;padding:12px 0">Belum ada order</div>`;
  } else {
    orderEl.innerHTML = orders.slice(-5).reverse().map(o => `
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);padding:6px 0;border-bottom:1px solid var(--border-dim);display:flex;justify-content:space-between">
        <span style="color:var(--text)">${o.nama}</span>
        <span style="color:var(--cyan)">${o.total}</span>
      </div>
    `).join('');
  }

  closeProfil_close();
  document.getElementById('profilModal').classList.add('open');
};

window.closeProfil = function () {
  document.getElementById('profilModal').classList.remove('open');
};

function closeProfil_close() {}

window.resetPassword = async function () {
  const user = auth.currentUser;
  if (!user) return;
  const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  await sendPasswordResetEmail(auth, user.email);
  showToast('▸ Link reset password dikirim ke ' + user.email);
};