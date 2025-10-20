// ✅ استرجاع بيانات المستخدم من التخزين المحلي
const token = localStorage.getItem('token');
const profile = JSON.parse(localStorage.getItem('profile') || "null");

// ✅ عناصر من الصفحة
const who = document.getElementById('who');
const loginLink = document.getElementById('loginLink');
const issuerInput = document.getElementById('issuer');

// ✅ دالة التهيئة عند تحميل الصفحة
function init() {
  if (profile) {
    // عرض اسم المستخدم ودوره
    who.textContent = `مرحباً، ${profile.name} — الدور: ${profile.role}`;
    
    // إخفاء رابط تسجيل الدخول في حال الدخول
    if (loginLink) loginLink.style.display = 'none';
    
    // تعبئة حقل الجهة المصدّرة
    if (issuerInput) issuerInput.value = profile.name || 'جهة مُصدِّرة';
  } else {
    who.textContent = 'لم تقم بتسجيل الدخول';
  }

  // عرض قسم إصدار الشهادة افتراضياً
  showSection('issue');
  // تحميل قائمة الشهادات
  loadList();
}

// تشغيل init عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', init);

// ✅ تسجيل الخروج
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('profile');
  location.href = '/login.html';
}

// ✅ عرض الأقسام حسب الزر
function showSection(id) {
  for (const sec of document.querySelectorAll('section'))
    sec.classList.add('hide');
  
  document.getElementById(id).classList.remove('hide');
}

// ✅ تحميل قائمة الشهادات
async function loadList() {
  if (!token) return;

  const res = await fetch('/api/certificates', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!res.ok) {
    console.log(data);
    return;
  }

  const tbody = document.getElementById('tbody');

  // إنشاء جدول الشهادات
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><button onclick="delCert('${c.id}')">إلغاء</button></td>
      <td><span class="badge">${c.status}</span></td>
      <td>${c.title}</td>
      <td>${c.studentName}</td>
      <td>${c.id}</td>
    </tr>
  `).join('');
}

// ✅ إصدار شهادة جديدة
async function issue() {
  if (!token) {
    location.href = '/login.html';
    return;
  }

  const payload = {
    title: document.getElementById('title').value.trim(),
    studentName: document.getElementById('student').value.trim(),
    issueDate: document.getElementById('date').value
  };

  // التحقق من تعبئة الحقول
  if (!payload.title || !payload.studentName || !payload.issueDate) {
    alert('يرجى تعبئة كل الحقول');
    return;
  }

  const res = await fetch('/api/certificates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'فشل الإصدار');
    return;
  }

  alert(`تم الإصدار. رقم الشهادة: ${data.id}`);
  loadList();
}

// ✅ حذف / إلغاء شهادة
async function delCert(id) {
  if (!confirm('هل تريد إلغاء هذه الشهادة؟')) return;

  const res = await fetch(`/api/certificates/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || 'فشل الإلغاء');
    return;
  }

  loadList();
}

// ✅ التحقق من شهادة
async function verify() {
  const id = document.getElementById('verifyId').value.trim();

  if (!id) {
    alert('أدخل رقم الشهادة');
    return;
  }

  const res = await fetch(`/api/verify/${id}`);
  const data = await res.json();

  const box = document.getElementById('verifyBox');
  box.classList.remove('hide');

  if (!data.valid) {
    box.innerHTML = `<b>النتيجة:</b> غير صالح / لا يوجد.`;
  } else {
    const c = data.certificate;
    box.innerHTML = `
      <b>النتيجة:</b> صالح ✅<br>
      <b>الاسم:</b> ${c.studentName}<br>
      <b>العنوان:</b> ${c.title}<br>
      <b>التاريخ:</b> ${c.issueDate}<br>
      <b>المُصدِّر:</b> ${c.issuer}<br>
      <b>الرقم:</b> ${c.id}
    `;
  }
}
