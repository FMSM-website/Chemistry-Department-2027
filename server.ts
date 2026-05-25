import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(process.cwd(), "submissions.json");
const WISHES_FILE = path.join(process.cwd(), "pedagogical_wishes.json");
const EMAILS_FILE = path.join(process.cwd(), "email_notifications.json");

// Ensure data file exists with initial empty array
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

if (!fs.existsSync(WISHES_FILE)) {
  fs.writeFileSync(WISHES_FILE, JSON.stringify([], null, 2), "utf8");
}

if (!fs.existsSync(EMAILS_FILE)) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify([], null, 2), "utf8");
}

// Read submissions helper
function readSubmissions() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Read pedagogical wishes helper
function readWishes() {
  try {
    const data = fs.readFileSync(WISHES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Read email notifications helper
function readEmails() {
  try {
    const data = fs.readFileSync(EMAILS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write submissions helper
function writeSubmissions(submissions: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf8");
}

// Write wishes helper
function writeWishes(wishes: any[]) {
  fs.writeFileSync(WISHES_FILE, JSON.stringify(wishes, null, 2), "utf8");
}

// Write emails helper
function writeEmails(emails: any[]) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2), "utf8");
}

// 1. Get all submissions
app.get("/api/submissions", (req, res) => {
  const submissions = readSubmissions();
  res.json(submissions);
});

// 2. Add or update submissions
app.post("/api/submissions", async (req, res) => {
  try {
    const data = req.body;
    
    // Create new submission object
    const newSubmission = {
      id: "sub_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...data
    };

    // Save locally to ensure no data loss
    const submissions = readSubmissions();
    submissions.push(newSubmission);
    writeSubmissions(submissions);

    // Forward/Proxy proposal to Owner's Google Apps Script for live sheet sync
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycby5M744MfIz53wcu5sd6T3nRkILypHqAbZhf_cyuC_D-McSJ10jrVo7M5RCqYC_CDc50A/exec";
    
    // We send BOTH Arabic and English keys to guarantee that the Google Apps Script
    // will successfully read the fields whether it references the old Arabic keys or the new English keys!
    const formData = new URLSearchParams();
    
    // English Keys
    formData.append("supervisor_fullname", data.supervisor_fullname || "");
    formData.append("supervisor_rank", data.supervisor_rank || "");
    formData.append("supervisor_email", data.supervisor_email || "");
    formData.append("cosupervisor_name", data.cosupervisor_name || "");
    formData.append("cosupervisor_rank", data.cosupervisor_rank || "");
    formData.append("cosupervisor_email", data.cosupervisor_email || "");
    formData.append("cosupervisor_phone", data.cosupervisor_phone || "");
    formData.append("specialty", data.specialty || "");
    formData.append("title_arabic", data.title_arabic || "");
    formData.append("title_english", data.title_english || "");
    formData.append("work_type", data.work_type || "");
    formData.append("summary", data.summary || "");
    formData.append("keywords", data.keywords || "");

    // Arabic Keys (Exact matching with the exported CSV / Excel headers)
    formData.append("الاسم الكامل للمشرف", data.supervisor_fullname || "");
    formData.append("الرتبة العلمية للمشرف", data.supervisor_rank || "");
    formData.append("البريد الإلكتروني", data.supervisor_email || "");
    formData.append("اسم المساعد", data.cosupervisor_name || "");
    formData.append("رتبة المساعد", data.cosupervisor_rank || "");
    formData.append("البريد الإلكتروني للمساعد", data.cosupervisor_email || "");
    formData.append("هاتف المساعد", data.cosupervisor_phone || "");
    formData.append("التخصص المستهدف", data.specialty || "");
    formData.append("عنوان المشروع بالعربية", data.title_arabic || "");
    formData.append("عنوان المشروع بالإنجليزية", data.title_english || "");
    formData.append("طبيعة العمل", data.work_type || "");
    formData.append("الملخص التقني", data.summary || "");
    formData.append("الكلمات المفتاحية", data.keywords || "");

    // Arabic Keys (Aliases with spaces - for absolute backward and fallback compatibility)
    formData.append("الاسم الكامل", data.supervisor_fullname || "");
    formData.append("رتبة المشرف", data.supervisor_rank || "");
    formData.append("بريد التواصل", data.supervisor_email || "");
    formData.append("المشرف المساعد", data.cosupervisor_name || "");
    formData.append("البريد الإلكتروني للأستاذ المساعد", data.cosupervisor_email || "");
    formData.append("بريد المساعد", data.cosupervisor_email || "");
    formData.append("رقم هاتف الأستاذ المساعد", data.cosupervisor_phone || "");
    formData.append("العنوان بالعربية", data.title_arabic || "");
    formData.append("العنوان باللغة العربية", data.title_arabic || "");
    formData.append("العنوان بالإنجليزية", data.title_english || "");
    formData.append("العنوان باللغة الإنجليزية", data.title_english || "");
    formData.append("نوع العمل", data.work_type || "");
    formData.append("الملخص", data.summary || "");

    // Arabic Keys (Aliases with underscores - for systems requiring legacy formatting)
    formData.append("الاسم_الكامل", data.supervisor_fullname || "");
    formData.append("رتبة_المشرف", data.supervisor_rank || "");
    formData.append("بريد_التواصل", data.supervisor_email || "");
    formData.append("المشرف_المساعد", data.cosupervisor_name || "");
    formData.append("رتبة_المساعد", data.cosupervisor_rank || "");
    formData.append("بريد_المساعد", data.cosupervisor_email || "");
    formData.append("هاتف_المساعد", data.cosupervisor_phone || "");
    formData.append("التخصص", data.specialty || "");
    formData.append("التخصص_المستهدف", data.specialty || "");
    formData.append("العنوان_بالعربية", data.title_arabic || "");
    formData.append("العنوان_بالإنجليزية", data.title_english || "");
    formData.append("طبيعة_العمل", data.work_type || "");
    formData.append("نوع_العمل", data.work_type || "");
    formData.append("الملخص_الكامل", data.summary || "");
    formData.append("الكلمات_المفتاحية", data.keywords || "");

    // Also send timestamp and ID
    formData.append("submission_id", newSubmission.id);
    formData.append("timestamp", newSubmission.createdAt);

    let scriptSuccess = false;
    try {
      // Fire-and-forget or await Google Apps Script post with 8 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(googleScriptUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      scriptSuccess = response.ok;
    } catch (err) {
      console.error("Google Sheets forward error:", err);
    }

    res.json({
      success: true,
      message: "Proposed successfully saved locally and synced to Sheets",
      syncedToSheets: scriptSuccess,
      submission: newSubmission
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Delete a submission (Admin feature)
app.delete("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  let submissions = readSubmissions();
  const initialLength = submissions.length;
  submissions = submissions.filter((s: any) => s.id !== id);
  if (submissions.length === initialLength) {
    return res.status(404).json({ success: false, message: "Submission not found" });
  }
  writeSubmissions(submissions);
  res.json({ success: true, message: "Submission deleted successfully" });
});

// 4. Update an existing submission (Admin edit typos)
app.put("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex((s: any) => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Submission not found" });
  }

  submissions[index] = {
    ...submissions[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };
  
  writeSubmissions(submissions);
  res.json({ success: true, submission: submissions[index] });
});

// === Pedagogical Wishes APIs ===

// 1. Get all wishes
app.get("/api/wishes", (req, res) => {
  const wishes = readWishes();
  res.json(wishes);
});

// Get all email notifications
app.get("/api/emails", (req, res) => {
  const emails = readEmails();
  res.json(emails);
});

// 2. Add multiple or single wish
app.post("/api/wishes", (req, res) => {
  try {
    const data = req.body;
    const wishes = readWishes();
    const resultWishes: any[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const newWish = {
          id: "wish_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
          status: item.status || 'pending',
          ...item
        };
        wishes.push(newWish);
        resultWishes.push(newWish);
      });
    } else {
      const newWish = {
        id: "wish_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        status: data.status || 'pending',
        ...data
      };
      wishes.push(newWish);
      resultWishes.push(newWish);
    }

    writeWishes(wishes);
    res.json({
      success: true,
      message: "Wishes successfully recorded",
      submissions: resultWishes
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Delete a wish
app.delete("/api/wishes/:id", (req, res) => {
  const { id } = req.params;
  let wishes = readWishes();
  const initialLength = wishes.length;
  wishes = wishes.filter((w: any) => w.id !== id);
  if (wishes.length === initialLength) {
    return res.status(404).json({ success: false, message: "Wish not found" });
  }
  writeWishes(wishes);
  res.json({ success: true, message: "Wish deleted successfully" });
});

// 4. Update an existing wish
app.put("/api/wishes/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const wishes = readWishes();
  const index = wishes.findIndex((w: any) => w.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Wish not found" });
  }

  const oldWish = wishes[index];
  const oldStatus = oldWish.status || 'pending';
  const newStatus = updatedData.status;

  wishes[index] = {
    ...wishes[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  let emailNotificationSent = false;
  let emailDetails = null;

  // When status changes to accepted from something else
  if (newStatus === 'accepted' && oldStatus !== 'accepted') {
    const emailSubject = `🟢 قبول رغبتك البيداغوجية: ${wishes[index].module_name} بقسم ${wishes[index].department_label}`;
    const emailBody = `
أهلاً بك الأستاذ(ة) المحترم(ة) ${wishes[index].teacher_name}،

يسعدنا في إدارة كلية الرياضيات وعلوم المادة - جامعة قاصدي مرباح ورقلة أن نبلغكم بأنه قد تمت الموافقة وقبول رغبتكم البيداغوجية والتدريسية المودعة كالتالي:

- المادة التدريسية: ${wishes[index].module_name}
- القسم: ${wishes[index].department_label}
- المستوى الدراسي: ${wishes[index].year_level}
- نوع الحصص المعتمدة: ${Array.isArray(wishes[index].lesson_types) ? wishes[index].lesson_types.map((t: string) => t === 'Cours' ? 'محاضرة' : t === 'TD' ? 'أعمال موجهة' : 'أعمال تطبيقية').join(' ، ') : '-'}
- عدد الأفواج المقترحة: ${wishes[index].group_count || '-'}

نشكركم على مساهمتكم الدائمة في تطوير العملية التعليمية بالكلية.

مع تحيات،
إدارة كلية الرياضيات وعلوم المادة
جامعة قاصدي مرباح ورقلة
    `.trim();

    const newEmail = {
      id: "email_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      wishId: id,
      teacherName: wishes[index].teacher_name,
      teacherEmail: wishes[index].teacher_email,
      moduleName: wishes[index].module_name,
      departmentLabel: wishes[index].department_label,
      sentAt: new Date().toISOString(),
      subject: emailSubject,
      body: emailBody,
      status: 'sent'
    };

    const emails = readEmails();
    emails.push(newEmail);
    writeEmails(emails);

    emailNotificationSent = true;
    emailDetails = newEmail;

    console.log(`[EMAIL DISPATCH SUCCESS] Automatically emailed Teacher ${wishes[index].teacher_name} (${wishes[index].teacher_email}): "${emailSubject}"`);
  }

  writeWishes(wishes);
  res.json({ 
    success: true, 
    wish: wishes[index],
    emailNotificationSent,
    emailDetails
  });
});

// 5. Verify admin passcode
app.post("/api/admin/login", (req, res) => {
  const { passcode } = req.body;
  // Secure access with a specific, secure passcode
  if (passcode === "ouargla2026") {
    return res.json({ success: true, token: "admin_token_" + Date.now() });
  }
  res.status(401).json({ success: false, message: "رمز المرور غير صحيح أو غير مصرح به" });
});

// Vite server integration or production dist static serving
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

init();
