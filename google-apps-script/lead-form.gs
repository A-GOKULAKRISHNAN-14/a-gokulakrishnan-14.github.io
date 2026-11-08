/**
 * =======================================================================
 * Portfolio Enquiry Form Backend: Google Sheets + Email Alert + Client Confirmation
 * =======================================================================
 *
 * How to setup:
 * 1. Create a new Google Sheet at https://sheets.new
 * 2. Click Extensions → Apps Script
 * 3. Replace all code in the editor with this script
 * 4. Click Save (disk icon)
 * 5. Click Deploy → New deployment
 *    - Select type: Web app (gear icon)
 *    - Description: Portfolio Lead Form v1
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone
 * 6. Click Deploy → Authorize access (Advanced → Go to project (unsafe) → Allow)
 * 7. Copy the Deployment ID or the full Web App URL (ends with /exec).
 */

const CONFIG = {
  NOTIFY_EMAIL: "gokulakrishnan.agk14@gmail.com", // Where new lead notifications are sent
  SHEET_NAME: "Leads",                           // Tab name in Google Sheet
  SEND_THANK_YOU: true,                          // Send immediate receipt/confirmation email to client
  OWNER_NAME: "Gokulakrishnan A",
  WHATSAPP: "917010217367",                      // 91 + phone number without + or spaces
};

const HEADERS = ["Date & Time", "Name", "Phone", "Email", "Business", "Services", "Message", "Page", "Status"];
const LIMITS = { name: 80, phone: 25, email: 120, business: 100, services: 250, message: 2000, page: 300 };

function doPost(e) {
  try {
    const raw = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Honeypot spam trap
    if (raw.website) return json_({ ok: true, spam: true });

    const d = {};
    Object.keys(LIMITS).forEach((k) => {
      d[k] = String(raw[k] || "").trim().slice(0, LIMITS[k]);
    });

    if (!d.name || d.name.length < 2) return json_({ ok: false, error: "name" });
    if (!d.phone || d.phone.replace(/\D/g, "").length < 8) return json_({ ok: false, error: "phone" });
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return json_({ ok: false, error: "email" });

    // Anti-duplicate protection (2-minute window)
    const cache = CacheService.getScriptCache();
    const key = "lead_" + Utilities.base64EncodeWebSafe((d.email + "|" + d.phone).toLowerCase()).slice(0, 150);
    if (cache.get(key)) {
      return json_({ ok: true, duplicate: true });
    }

    // 1. Record row in Google Sheet
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
      sheet.appendRow([
        timestamp,
        safeCell_(d.name),
        safeCell_(d.phone),
        safeCell_(d.email),
        safeCell_(d.business || "-"),
        safeCell_(d.services || "-"),
        safeCell_(d.message || "-"),
        safeCell_(d.page || "-"),
        "New"
      ]);
    } finally {
      lock.releaseLock();
    }
    cache.put(key, "1", 120);

    // 2. Send email notification to you (Gokul)
    try {
      sendAdminAlert_(d);
    } catch (err) {
      console.error("Admin alert mail error:", err);
    }

    // 3. Send confirmation / received email to the client
    if (CONFIG.SEND_THANK_YOU && d.email) {
      try {
        sendClientReceipt_(d);
      } catch (err) {
        console.error("Client confirmation mail error:", err);
      }
    }

    return json_({ ok: true });
  } catch (err) {
    console.error("doPost handler error:", err);
    return json_({ ok: false, error: err.message || "server" });
  }
}

// Verification endpoint: opening the /exec URL in a browser displays this confirmation
function doGet() {
  return json_({ ok: true, status: "live", service: "Gokulakrishnan Portfolio Lead API" });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#ede9fe")
      .setFontColor("#4338ca");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function safeCell_(v) {
  return typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function esc_(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Admin Alert Email sent to Gokul
function sendAdminAlert_(d) {
  const cleanPhone = d.phone.replace(/\D/g, "");
  const waNumber = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
  const waUrl = "https://wa.me/" + waNumber;

  const rows = [
    ["Name", d.name],
    ["Phone", d.phone],
    ["Email", d.email],
    ["Business", d.business || "Not specified"],
    ["Services Needed", d.services || "General Inquiry"],
    ["Project Details", d.message || "None provided"],
    ["Submitted From", d.page || "Portfolio"]
  ];

  const html =
    '<div style="font-family:\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;max-width:580px;margin:20px auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.06);">' +
    '  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);color:#ffffff;padding:24px;text-align:left;">' +
    '    <h2 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">🔔 New Website Lead Received!</h2>' +
    '    <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">Someone filled out the quote form on your portfolio.</p>' +
    '  </div>' +
    '  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:4px;">' +
    rows.map((r) =>
      '    <tr>' +
      '      <td style="padding:12px 20px;color:#6b7280;width:130px;vertical-align:top;border-bottom:1px solid #f3f4f6;font-weight:600;">' + r[0] + '</td>' +
      '      <td style="padding:12px 20px;color:#111827;border-bottom:1px solid #f3f4f6;white-space:pre-wrap;">' + esc_(r[1]) + '</td>' +
      '    </tr>'
    ).join("") +
    '  </table>' +
    '  <div style="padding:20px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">' +
    '    <a href="' + waUrl + '" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;margin-right:10px;">💬 Chat on WhatsApp</a>' +
    '    <a href="mailto:' + esc_(d.email) + '" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;">✉️ Reply via Email</a>' +
    '  </div>' +
    '</div>';

  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    replyTo: d.email,
    subject: "🔥 New Lead: " + d.name + (d.services ? " · " + d.services : ""),
    body: rows.map((r) => r[0] + ": " + r[1]).join("\n"),
    htmlBody: html,
    name: "Portfolio Lead Notifier"
  });
}

// Confirmation Email sent to the Client
function sendClientReceipt_(d) {
  const firstName = d.name.trim().split(" ")[0];
  const waContactUrl = "https://wa.me/" + CONFIG.WHATSAPP;

  const html =
    '<div style="font-family:\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:20px auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.06);">' +
    '  <div style="background:linear-gradient(135deg,#06070b,#1e1b4b);color:#ffffff;padding:26px 24px;border-bottom:2px solid #8b5cf6;">' +
    '    <h2 style="margin:0;font-size:20px;font-weight:700;">Thanks for reaching out, ' + esc_(firstName) + '!</h2>' +
    '    <p style="margin:6px 0 0;font-size:14px;color:#cbd5e1;">I have received your project enquiry.</p>' +
    '  </div>' +
    '  <div style="padding:24px;color:#374151;font-size:15px;line-height:1.65;">' +
    '    <p style="margin-top:0;">Hi ' + esc_(firstName) + ',</p>' +
    '    <p>Thank you for submitting your enquiry' + (d.services ? ' regarding <b>' + esc_(d.services) + '</b>' : '') + '. Your details have been received and saved.</p>' +
    '    <p>I am reviewing your project requirements and will reply within <b>24 hours</b> with tailored solutions and pricing.</p>' +
    '    <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:14px 18px;border-radius:6px;margin:20px 0;">' +
    '      <p style="margin:0;font-size:14px;color:#475569;"><b>Need a faster response?</b></p>' +
    '      <p style="margin:4px 0 0;font-size:14px;">Feel free to reach out directly on WhatsApp: <a href="' + waContactUrl + '" style="color:#6366f1;font-weight:600;text-decoration:none;">+91 70102 17367</a></p>' +
    '    </div>' +
    '    <p style="margin-bottom:0;color:#6b7280;font-size:14px;">Best regards,<br><strong style="color:#111827;font-size:15px;">' + CONFIG.OWNER_NAME + '</strong><br>Full Stack Engineer &amp; Website Designer<br><a href="https://a-gokulakrishnan-14.github.io" style="color:#6366f1;text-decoration:none;">a-gokulakrishnan-14.github.io</a></p>' +
    '  </div>' +
    '</div>';

  MailApp.sendEmail({
    to: d.email,
    replyTo: CONFIG.NOTIFY_EMAIL,
    subject: "We received your enquiry! · " + CONFIG.OWNER_NAME,
    body: "Hi " + firstName + ",\n\n" +
      "Thank you for reaching out! I have received your enquiry and will get back to you within 24 hours.\n\n" +
      "If you need an immediate response, feel free to reach me on WhatsApp: " + waContactUrl + "\n\n" +
      "Best regards,\n" + CONFIG.OWNER_NAME + "\n" +
      "https://a-gokulakrishnan-14.github.io",
    htmlBody: html,
    name: CONFIG.OWNER_NAME
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
