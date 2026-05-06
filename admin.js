/* =============================================
   ADMIN.JS — Dashboard Admin NEXUS HOST
   ============================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -----------------------------------------------
   FIREBASE CONFIG
   ----------------------------------------------- */
const firebaseConfig = {
  apiKey:            "AIzaSyBq30K69ezDu86TewFcMtQVR7WhCes92oA",
  authDomain:        "iki-d35c9.firebaseapp.com",
  projectId:         "iki-d35c9",
  storageBucket:     "iki-d35c9.firebasestorage.app",
  messagingSenderId: "745498733905",
  appId:             "1:745498733905:web:5571e71887e21f919d3770"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

/* -----------------------------------------------
   EMAIL ADMIN — hanya email ini yang bisa akses
   ----------------------------------------------- */
const ADMIN_EMAIL = 'rpahri218@gmail.com';

/* -----------------------------------------------
   LOADING BAR
   ----------------------------------------------- */
let loadPct = 0;
const loadInterval = setInterval(() => {
  loadPct += 2;
  document.getElementById('loadingFill').style.width = loadPct + '%';
  if (loadPct >= 90) clearInterval(loadInterval);
}, 30);

/* -----------------------------------------------
   CEK AUTH
   ----------------------------------------------- */
onAuthStateChanged(auth, async (user) => {
  clearInterval(loadInterval);
  document.getElementById('loadingFill').style.width = '100%';

  setTimeout(() => {
    document.getElementById('loadingScreen').style.display = 'none';

    if (!user || user.email !== ADMIN_EMAIL) {
      document.getElementById('deniedScreen').classList.add('show');
      return;
    }

    // admin verified
    document.getElementById('adminWrap').style.display = 'block';
    document.getElementById('adminName').textContent = (user.displayName || 'ADMIN').toUpperCase();
    const av = document.getElementById('adminAvatar');
    av.innerHTML = user.photoURL
      ? `<img src="${user.photoURL}">`
      : (user.displayName || 'A')[0].toUpperCase();

    // init semua fitur
    initMembers();
    initMaintenance();
    initBanned();
    initOrders();
    initLog();
    initStats();

  }, 500);
});

/* -----------------------------------------------
   LOGOUT
   ----------------------------------------------- */
window.logoutAdmin = async function () {
  await signOut(auth);
  window.location.href = 'index.html';
};

/* -----------------------------------------------
   TAB SWITCHER
   ----------------------------------------------- */
window.showTab = function (name, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
};

/* -----------------------------------------------
   STATS REALTIME
   ----------------------------------------------- */
function initStats() {
  // total members
  onSnapshot(collection(db, 'users'), snap => {
    document.getElementById('statMembers').textContent = snap.size;
  });

  // online sekarang
  onSnapshot(collection(db, 'presence'), snap => {
    let online = 0;
    snap.forEach(d => { if (d.data().online) online++; });
    document.getElementById('statOnline').textContent = online;
  });

  // banned
  onSnapshot(collection(db, 'banned'), snap => {
    document.getElementById('statBanned').textContent = snap.size;
  });

  // orders
  onSnapshot(collection(db, 'orders'), snap => {
    document.getElementById('statOrders').textContent = snap.size;
  });
}

/* -----------------------------------------------
   MEMBERS REALTIME
   ----------------------------------------------- */
let allMembers = [];

function initMembers() {
  onSnapshot(collection(db, 'users'), async (snap) => {
    allMembers = [];
    const presenceSnap = await getDocs(collection(db, 'presence'));
    const bannedSnap   = await getDocs(collection(db, 'banned'));

    const onlineMap = {};
    presenceSnap.forEach(d => onlineMap[d.id] = d.data().online);

    const bannedMap = {};
    bannedSnap.forEach(d => bannedMap[d.data().email] = true);

    snap.forEach(d => {
      allMembers.push({ id: d.id, ...d.data(), online: onlineMap[d.id] || false, banned: bannedMap[d.data().email] || false });
    });

    renderMembers(allMembers);
  });
}

function renderMembers(members) {
  const tbody = document.getElementById('memberTable');
  if (members.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">BELUM ADA MEMBER</td></tr>`;
    return;
  }

  tbody.innerHTML = members.map(m => `
    <tr>
      <td>
        <div class="table-avatar">
          ${m.photoURL ? `<img src="${m.photoURL}">` : (m.displayName || '?')[0].toUpperCase()}
        </div>
      </td>
      <td style="color:var(--text)">${m.displayName || '-'}</td>
      <td>${m.email || '-'}</td>
      <td>
        ${m.banned
          ? `<span class="status-banned">● BANNED</span>`
          : m.online
            ? `<span class="status-online">● ONLINE</span>`
            : `<span class="status-offline">● OFFLINE</span>`
        }
      </td>
      <td>${m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}</td>
      <td>
        <button class="action-btn btn-kick" onclick="kickUser('${m.email}', '${m.displayName || m.email}')">KICK</button>
        ${m.banned
          ? `<button class="action-btn btn-unban" onclick="unbanUser('${m.email}')">UNBAN</button>`
          : `<button class="action-btn btn-ban" onclick="confirmBan('${m.email}', '${m.displayName || m.email}')">BAN</button>`
        }
      </td>
    </tr>
  `).join('');
}

window.filterMembers = function () {
  const q = document.getElementById('searchMember').value.toLowerCase();
  const filtered = allMembers.filter(m =>
    (m.email || '').toLowerCase().includes(q) ||
    (m.displayName || '').toLowerCase().includes(q)
  );
  renderMembers(filtered);
};

/* -----------------------------------------------
   KICK USER
   ----------------------------------------------- */
window.kickUser = function (email, name) {
  showConfirm(
    'KICK USER',
    `Kick ${name} (${email})? User akan di-logout dari sesi aktif.`,
    async () => {
      // tandai di Firestore biar client auto logout
      const q2 = query(collection(db, 'users'));
      const snap = await getDocs(q2);
      snap.forEach(async d => {
        if (d.data().email === email) {
          await setDoc(doc(db, 'kicked', d.id), { email, kickedAt: serverTimestamp() });
        }
      });
      addLog('KICK', `${name} (${email}) dikick dari sistem`);
    }
  );
};

/* -----------------------------------------------
   BAN USER
   ----------------------------------------------- */
window.confirmBan = function (email, name) {
  showConfirm(
    'BAN USER',
    `Ban ${name} (${email})? User tidak bisa login lagi.`,
    () => doBan(email, name, 'Dibanned oleh admin')
  );
};

async function doBan(email, name, reason) {
  await setDoc(doc(db, 'banned', email.replace(/\./g, '_')), {
    email,
    name,
    reason,
    bannedAt: serverTimestamp()
  });
  addLog('BAN', `${name} (${email}) dibanned — ${reason}`);
  loadBanned();
}

window.banUser = async function () {
  const email  = document.getElementById('banEmail').value.trim();
  const reason = document.getElementById('banReason').value.trim() || 'Dibanned oleh admin';
  if (!email) return;
  await doBan(email, email, reason);
  document.getElementById('banEmail').value  = '';
  document.getElementById('banReason').value = '';
};

/* -----------------------------------------------
   UNBAN USER
   ----------------------------------------------- */
window.unbanUser = function (email) {
  showConfirm('UNBAN USER', `Unban ${email}?`, async () => {
    await deleteDoc(doc(db, 'banned', email.replace(/\./g, '_')));
    addLog('UNBAN', `${email} di-unban`);
    loadBanned();
  });
};

/* -----------------------------------------------
   BANNED LIST
   ----------------------------------------------- */
function initBanned() { loadBanned(); }

async function loadBanned() {
  const snap  = await getDocs(collection(db, 'banned'));
  const tbody = document.getElementById('bannedTable');

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">TIDAK ADA YANG DIBANNED</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  snap.forEach(d => {
    const data = d.data();
    const tr   = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--text)">${data.email}</td>
      <td>${data.reason || '-'}</td>
      <td>${data.bannedAt ? new Date(data.bannedAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}</td>
      <td><button class="action-btn btn-unban" onclick="unbanUser('${data.email}')">UNBAN</button></td>
    `;
    tbody.appendChild(tr);
  });
}

/* -----------------------------------------------
   MAINTENANCE
   ----------------------------------------------- */
let maintenanceTimer = null;

function initMaintenance() {
  onSnapshot(doc(db, 'settings', 'maintenance'), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    const toggle    = document.getElementById('mtToggle');
    const indicator = document.getElementById('mtIndicator');

    toggle.checked = data.active || false;

    if (data.active) {
      indicator.textContent = '● MAINTENANCE AKTIF';
      indicator.className   = 'mt-status-indicator active';
    } else {
      indicator.textContent = '● WEBSITE NORMAL';
      indicator.className   = 'mt-status-indicator';
    }

    if (data.title)    document.getElementById('mtTitle').value      = data.title;
    if (data.message)  document.getElementById('mtMessage').value    = data.message;
    if (data.deadline) document.getElementById('mtDeadline').value   = data.deadline;
    if (data.image)    document.getElementById('mtImage').value      = data.image;

    updatePreview(data);
    startCountdown(data.deadline);
  });
}

window.toggleMaintenance = async function () {
  const active = document.getElementById('mtToggle').checked;
  const cur    = (await getDoc(doc(db, 'settings', 'maintenance'))).data() || {};
  await setDoc(doc(db, 'settings', 'maintenance'), { ...cur, active });
  addLog('MAINTENANCE', `Mode maintenance ${active ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`);
};

window.saveMaintenance = async function () {
  const data = {
    active:   document.getElementById('mtToggle').checked,
    title:    document.getElementById('mtTitle').value,
    message:  document.getElementById('mtMessage').value,
    deadline: document.getElementById('mtDeadline').value,
    image:    document.getElementById('mtImage').value,
  };
  await setDoc(doc(db, 'settings', 'maintenance'), data);
  updatePreview(data);
  startCountdown(data.deadline);
  addLog('MAINTENANCE', 'Konfigurasi maintenance disimpan');
  alert('✅ Konfigurasi disimpan!');
};

function updatePreview(data) {
  if (data.title)   document.getElementById('previewTitle').textContent = data.title;
  if (data.message) document.getElementById('previewMsg').textContent   = data.message;
}

function startCountdown(deadline) {
  if (maintenanceTimer) clearInterval(maintenanceTimer);
  if (!deadline) return;

  const end = new Date(deadline).getTime();

  maintenanceTimer = setInterval(() => {
    const now  = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      document.getElementById('previewTimer').textContent = 'SELESAI!';
      clearInterval(maintenanceTimer);
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('previewTimer').textContent =
      `SELESAI DALAM: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}

/* -----------------------------------------------
   ORDERS
   ----------------------------------------------- */
function initOrders() {
  onSnapshot(collection(db, 'orders'), snap => {
    const tbody = document.getElementById('orderTable');
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">BELUM ADA ORDER</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const tr   = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text)">${data.nama || '-'}</td>
        <td>${data.email || '-'}</td>
        <td style="color:var(--cyan)">${data.paket || '-'}</td>
        <td style="color:var(--pink)">${data.total || '-'}</td>
        <td>${data.waktu || '-'}</td>
        <td><span style="color:var(--green);font-family:var(--font-mono);font-size:10px">● ${data.status || 'PENDING'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

/* -----------------------------------------------
   ACTIVITY LOG
   ----------------------------------------------- */
function initLog() {
  const logs = JSON.parse(localStorage.getItem('adminLog') || '[]');
  renderLog(logs);
}

function addLog(action, detail) {
  const logs = JSON.parse(localStorage.getItem('adminLog') || '[]');
  const now  = new Date().toLocaleTimeString('id-ID');
  logs.unshift({ time: now, action, detail });
  if (logs.length > 100) logs.pop();
  localStorage.setItem('adminLog', JSON.stringify(logs));
  renderLog(logs);
}

function renderLog(logs) {
  const el = document.getElementById('logList');
  if (logs.length === 0) {
    el.innerHTML = `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);padding:20px;text-align:center">LOG KOSONG</div>`;
    return;
  }
  el.innerHTML = logs.map(l => `
    <div class="log-item">
      <span class="log-time">${l.time}</span>
      <span class="log-action">[${l.action}]</span>
      <span class="log-detail">${l.detail}</span>
    </div>
  `).join('');
}

window.clearLog = function () {
  showConfirm('HAPUS LOG', 'Hapus semua activity log?', () => {
    localStorage.removeItem('adminLog');
    renderLog([]);
  });
};

/* -----------------------------------------------
   CONFIRM MODAL
   ----------------------------------------------- */
function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  document.getElementById('confirmModal').classList.add('show');
  document.getElementById('confirmOk').onclick = () => {
    closeConfirm();
    onOk();
  };
}

window.closeConfirm = function () {
  document.getElementById('confirmModal').classList.remove('show');
};