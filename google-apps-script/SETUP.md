# Connect the enquiry form to Google Sheets + email

About 5 minutes. Free. Done once.

## 1. Make the sheet
1. Open https://sheets.new (signed in as gokulakrishnan.agk14@gmail.com).
2. Name it **Website Leads**.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete what is there, paste all of `lead-form.gs`, press **Save**.

## 3. Publish it
1. **Deploy → New deployment** → gear icon → **Web app**.
2. Execute as: **Me** · Who has access: **Anyone**.
3. Press **Deploy**, then **Authorize access** → pick your account →
   "Google hasn't verified this app" → **Advanced → Go to (unsafe)** → **Allow**.
   (This warning is normal: it is your own script.)
4. Copy the **Web app URL** (ends with `/exec`).

## 4. Put the URL in the website
In `index.html`, find `data-endpoint=""` on the form and paste the URL:

```html
<form class="qf__form" id="quoteForm" data-endpoint="https://script.google.com/macros/s/XXXX/exec" novalidate>
```

## 5. Test
- Open the `/exec` URL in the browser. You should see `{"ok":true,...}`.
- Fill the form on the site. Wait 3 seconds before sending (faster sends are treated as bots).
- Check: new row in the **Leads** tab, alert in your inbox, thank-you email to the client.

## Changing the script later
Edit, save, then **Deploy → Manage deployments → pencil → Version: New version → Deploy**.
The URL stays the same. (A *New deployment* would make a new URL.)

## Good to know
- Gmail sends about **100 emails a day** from scripts. Each lead uses 2 (alert + thank-you).
  To use only 1, set `SEND_THANK_YOU: false`.
- The row is saved before the emails are sent, so a mail problem never loses a lead.
- The **Status** column starts as "New". Change it to Called / Won / Lost as you follow up.
