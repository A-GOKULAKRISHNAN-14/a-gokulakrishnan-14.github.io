/**
 * Portfolio enquiry form → Google Sheet row + email alert.
 *
 * Paste this into the Apps Script editor of your Google Sheet
 * (Extensions → Apps Script), then Deploy → New deployment → Web app.
 * Full steps: google-apps-script/SETUP.md
 */

const CONFIG = {
  NOTIFY_EMAIL: "gokulakrishnan.agk14@gmail.com", // where new-lead alerts go
  SHEET_NAME: "Leads",
  SEND_THANK_YOU: true, // also email the client a short "got it" note
  OWNER_NAME: "Gokulakrishnan A",
  WHATSAPP: "917010217367",
};

const HEADERS = ["Date", "Name", "Phone", "Email", "Business", "Services", "Message", "Page", "Status"];
const LIMITS = { name: 80, phone: 20, email: 120, business: 100, services: 200, message: 1500, page: 300 };

function doPost(e) {
  try {
    const raw = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // bot trap: pretend it worked, store nothing
    if (raw.website) return json_({ ok: true });

    const d = {};
    Object.keys(LIMITS).forEach((k) => { d[k] = String(raw[k] || "").trim().slice(0, LIMITS[k]); });

    if (d.name.length < 2) return json_({ ok: false, error: "name" });
    if (d.phone.replace(/\D/g, "").length < 8) return json_({ ok: false, error: "phone" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return json_({ ok: false, error: "email" });

    // same person pressing Send twice within 2 minutes → keep one row
    const cache = CacheService.getScriptCache();
    const key = "lead_" + Utilities.base64EncodeWebSafe(d.email.toLowerCase() + "|" + d.phone).slice(0, 200);
    if (cache.get(key)) return json_({ ok: true, duplicate: true });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      sheet.appendRow([
        new Date(), d.name, d.phone, d.email, d.business, d.services, d.message, d.page, "New",
      ].map(safeCell_));
    } finally {
      lock.releaseLock();
    }
    cache.put(key, "1", 120);

    // the row is saved first, so a mail problem never loses a lead
    try { sendAlert_(d); } catch (err) { console.error("alert mail failed", err); }
    if (CONFIG.SEND_THANK_YOU) {
      try { sendThankYou_(d); } catch (err) { console.error("thank-you mail failed", err); }
    }

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  }
}

// open the /exec URL in a browser to check the deployment is live
function doGet() {
  return json_({ ok: true, service: "portfolio-lead-form" });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#ede9fe");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("dd MMM yyyy, hh:mm am/pm");
  }
  return sheet;
}

// stop "=HYPERLINK(...)"-style input from running as a formula in the sheet
function safeCell_(v) {
  return typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function sendAlert_(d) {
  const rows = [
    ["Name", d.name], ["Phone", d.phone], ["Email", d.email], ["Business", d.business],
    ["Needs", d.services], ["Message", d.message], ["From page", d.page],
  ].filter((r) => r[1]);
  const phone = d.phone.replace(/\D/g, "");
  const wa = "https://wa.me/" + (phone.length === 10 ? "91" + phone : phone);

  const html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">' +
    '<div style="background:linear-gradient(110deg,#7c3aed,#06b6d4);color:#fff;padding:18px 22px;font-size:18px;font-weight:600">🔔 New enquiry from your website</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
    rows.map((r) =>
      '<tr><td style="padding:10px 22px;color:#6b7280;width:110px;vertical-align:top;border-top:1px solid #f1f1f4">' + r[0] +
      '</td><td style="padding:10px 22px;color:#111827;border-top:1px solid #f1f1f4;white-space:pre-wrap">' + esc_(r[1]) + "</td></tr>"
    ).join("") +
    "</table>" +
    '<div style="padding:18px 22px;border-top:1px solid #f1f1f4">' +
    '<a href="' + wa + '" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;margin-right:8px">Reply on WhatsApp</a>' +
    '<a href="mailto:' + esc_(d.email) + '" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600">Reply by email</a>' +
    "</div></div>";

  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    replyTo: d.email,
    subject: "New lead: " + d.name + (d.services ? " · " + d.services : ""),
    body: rows.map((r) => r[0] + ": " + r[1]).join("\n"),
    htmlBody: html,
    name: "Portfolio Leads",
  });
}

function sendThankYou_(d) {
  const first = d.name.split(" ")[0];
  const html =
    '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#111827;font-size:15px;line-height:1.6">' +
    "<p>Hi " + esc_(first) + ",</p>" +
    "<p>Thank you for your enquiry" + (d.services ? " about <b>" + esc_(d.services) + "</b>" : "") +
    ". I have your details and will reply within a day.</p>" +
    '<p>Want to talk sooner? <a href="https://wa.me/' + CONFIG.WHATSAPP + '" style="color:#7c3aed;font-weight:600">Message me on WhatsApp</a>.</p>' +
    "<p>Regards,<br><b>" + CONFIG.OWNER_NAME + "</b><br>Websites, apps &amp; CRMs that grow your business</p></div>";

  MailApp.sendEmail({
    to: d.email,
    replyTo: CONFIG.NOTIFY_EMAIL,
    subject: "Got your enquiry, " + first + "!",
    body: "Hi " + first + ",\n\nThank you for your enquiry. I have your details and will reply within a day.\n\n" +
      "WhatsApp: https://wa.me/" + CONFIG.WHATSAPP + "\n\nRegards,\n" + CONFIG.OWNER_NAME,
    htmlBody: html,
    name: CONFIG.OWNER_NAME,
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
