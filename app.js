
import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ================= GLOBAL ================= */

const $ = id => document.getElementById(id);
let currentUser = null;
let currentRole = null;
let chart = null;

/* ================= AUTH ================= */

window.signup = async () => {
  const email = $("signupEmail").value;
  const password = $("signupPassword").value;
  if (!email || !password) return alert("Fill all fields");

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    role: "viewer",
    createdAt: serverTimestamp()
  });

  alert("Account created. Login now.");
};

window.login = async () => {
  await signInWithEmailAndPassword(
    auth,
    $("email").value,
    $("password").value
  );
};

window.logout = async () => {
  await signOut(auth);
  location.reload();
};

onAuthStateChanged(auth, async user => {
  if (!user) return;

  currentUser = user;
  const snap = await getDoc(doc(db, "users", user.uid));
  currentRole = snap.data().role;

  $("auth").style.display = "none";
  $("app").style.display = "block";
  $("userRole").innerText = `Role: ${currentRole.toUpperCase()}`;

  if (currentRole === "treasurer" || currentRole === "admin") {
    $("treasurerSection").style.display = "block";
  }

  if (currentRole === "pastor") {
    $("pastorSection").style.display = "block";
    loadApprovals();
  }

  loadReport();
});

/* ================= SUBMIT TRANSACTION ================= */

window.submitTransaction = async () => {
  const type = $("txType").value;
  const amount = Number($("txAmount").value);
  const category = $("txCategory").value;

  if (!type || amount <= 0 || !category) {
    return alert("Invalid transaction");
  }

  await addDoc(collection(db, "transactions"), {
    type,
    amount,
    category,
    status: "pending",
    createdBy: currentUser.uid,
    createdAt: serverTimestamp()
  });

  $("txAmount").value = "";
  $("txCategory").value = "";
  alert("Submitted for pastor approval");
};

/* ================= APPROVAL (PASTOR ONLY) ================= */

async function loadApprovals() {
  const q = query(
    collection(db, "transactions"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  $("approvalTable").innerHTML = "";

  snap.forEach(d => {
    const x = d.data();
    $("approvalTable").innerHTML += `
      <tr>
        <td>${x.type}</td>
        <td>KES ${x.amount}</td>
        <td>${x.category}</td>
        <td>
          <button class="small" onclick="approveTx('${d.id}')">Approve</button>
          <button class="small danger" onclick="rejectTx('${d.id}')">Reject</button>
        </td>
      </tr>
    `;
  });
}

window.approveTx = async id => {
  await updateDoc(doc(db, "transactions", id), {
    status: "approved",
    approvedBy: currentUser.uid,
    approvedAt: serverTimestamp()
  });
  loadApprovals();
  loadReport();
};

window.rejectTx = async id => {
  await updateDoc(doc(db, "transactions", id), {
    status: "rejected",
    approvedBy: currentUser.uid,
    approvedAt: serverTimestamp()
  });
  loadApprovals();
};

/* ================= REPORTS ================= */

window.loadReport = async () => {
  let income = 0, expenses = 0;

  const snap = await getDocs(
    query(
      collection(db, "transactions"),
      where("status", "==", "approved")
    )
  );

  snap.forEach(d => {
    const x = d.data();
    if (x.type === "income") income += x.amount;
    if (x.type === "expense") expenses += x.amount;
  });

  $("totalIncome").innerText = income;
  $("totalExpenses").innerText = expenses;
  $("balance").innerText = income - expenses;

  drawChart(income, expenses);
};

/* ================= CHART ================= */

function drawChart(income, expense) {
  const ctx = $("financeChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{ data: [income, expense] }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true
    }
  });
}

/* ================= EXPORT ================= */

window.exportExcel = async () => {
  const rows = [];

  const snap = await getDocs(
    query(
      collection(db, "transactions"),
      where("status", "==", "approved")
    )
  );

  snap.forEach(d => {
    const x = d.data();
    rows.push({
      Type: x.type,
      Amount: x.amount,
      Category: x.category
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(rows),
    "Report"
  );

  XLSX.writeFile(wb, "Church_Report.xlsx");
};

window.exportPDF = async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text("Brooke of Life Church Finance Report", 14, 15);

  const rows = [];
  const snap = await getDocs(
    query(
      collection(db, "transactions"),
      where("status", "==", "approved")
    )
  );

  snap.forEach(d => {
    const x = d.data();
    rows.push([x.type, x.amount, x.category]);
  });

  pdf.autoTable({
    head: [["Type", "Amount", "Category"]],
    body: rows,
    startY: 25
  });

  pdf.save("Church_Report.pdf");
};
