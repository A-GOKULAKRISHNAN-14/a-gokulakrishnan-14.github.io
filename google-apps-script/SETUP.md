# Google Sheet + Email Lead Capture Setup

Follow these simple steps (takes 2 minutes, 100% free):

---

### Step 1: Create Your Google Sheet
1. Go to **[https://sheets.new](https://sheets.new)** in your browser (make sure you are signed in with `gokulakrishnan.agk14@gmail.com`).
2. Title the spreadsheet: **`Website Leads`**.

---

### Step 2: Paste the Apps Script Code
1. In the Google Sheets menu, click **Extensions** → **Apps Script**.
2. Erase any placeholder code inside the editor.
3. Open `google-apps-script/lead-form.gs` from your portfolio project, copy **all code**, and paste it into the Apps Script editor.
4. Click the **Save** button (or press `Ctrl + S`).

---

### Step 3: Deploy as a Web App
1. In the top right corner, click **Deploy** → **New deployment**.
2. Click the gear icon (⚙️) next to *Select type* and choose **Web app**.
3. Fill in the fields:
   - **Description**: `Portfolio Lead API`
   - **Execute as**: `Me (gokulakrishnan.agk14@gmail.com)`
   - **Who has access**: `Anyone` *(Crucial: allows visitors on your website to submit without logging in)*
4. Click **Deploy**.
5. Click **Authorize access**:
   - Choose your Google account (`gokulakrishnan.agk14@gmail.com`).
   - If Google shows *"Google hasn't verified this app"*, click **Advanced** → click **Go to Untitled project (unsafe)** → click **Allow**.
6. Google will display your **Deployment ID** and **Web app URL** (ending with `/exec`).

---

### Step 4: Share Your Deployment ID or Web App URL
Copy either the **Deployment ID** (e.g. `AKfycbx...`) or the **Web app URL** (`https://script.google.com/macros/s/.../exec`) and provide it here.

It will automatically be connected to `<form id="quoteForm" data-endpoint="...">` in `index.html`.

---

### What Happens On Each Submission:
1. **Google Sheet**: A new row is automatically created in the **"Leads"** tab with Timestamp, Name, Phone, Email, Business, Services, Message, and Status ("New").
2. **Notification Email to You**: You receive an instant alert at `gokulakrishnan.agk14@gmail.com` with full enquiry details and one-click buttons to **Chat on WhatsApp** or **Reply via Email**.
3. **Confirmation Email to Client**: The client immediately receives a branded email confirming receipt of their request, promising a reply within 24 hours, and providing your WhatsApp contact link.
