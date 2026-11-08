/* Gokulakrishnan A — Portfolio interactions. Vanilla JS, no dependencies. */
(() => {
  "use strict";

  const doc = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- intro (hero) ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add("is-loaded")));

  /* ---------- year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- scroll: progress bar + nav state (one rAF per frame) ---------- */
  const nav = $("#nav");
  const bar = $(".progress span");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle("is-scrolled", y > 20);
    if (!nav.classList.contains("is-open")) {
      nav.classList.toggle("is-hidden", y > lastY && y > 400);
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $("#navToggle");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    nav.classList.add("menu-ready");
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- hero name: letters rise in, then a colour wave runs across them ---------- */
  const helloName = $("#helloName");
  if (helloName) {
    const text = helloName.textContent;
    helloName.setAttribute("aria-label", text);
    helloName.innerHTML = Array.from(text)
      .map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c === " " ? "&nbsp;" : c}</span>`)
      .join("");
  }

  /* ---------- split headlines into words (keeps inner elements like .grad-text whole) ---------- */
  $$(".split").forEach((el) => {
    let i = 0;
    const wrap = (node) => {
      const w = document.createElement("span");
      w.className = "w";
      const inner = document.createElement("span");
      inner.style.setProperty("--i", i++);
      inner.appendChild(node);
      w.appendChild(inner);
      return w;
    };
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(" ") : wrap(document.createTextNode(part)));
        });
        node.replaceWith(frag);
      } else if (node.nodeName !== "BR") {
        // styled run (e.g. .grad-text): split it too, each word keeps the same class
        const frag = document.createDocumentFragment();
        node.textContent.trim().split(/\s+/).forEach((part, k) => {
          if (k) frag.appendChild(document.createTextNode(" "));
          const styled = node.cloneNode(false);
          styled.textContent = part;
          frag.appendChild(wrap(styled));
        });
        node.replaceWith(frag);
      }
    });
    el.classList.add("reveal-split");
  });

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$(".reveal, .split").forEach((el) => revealIO.observe(el));

  /* ---------- statement: words light up as you scroll ---------- */
  const scrub = $("#scrub");
  if (scrub) {
    const highlight = new Set(["grows", "journey,", "slips", "away."]);
    scrub.innerHTML = scrub.textContent.trim().split(/\s+/)
      .map((w) => `<span class="sw${highlight.has(w) ? " hl" : ""}">${w}</span>`).join(" ");
    const words = $$(".sw", scrub);
    if (reduceMotion) {
      words.forEach((w) => w.classList.add("on"));
    } else {
      let active = false;
      let lit = -1;
      const update = () => {
        const r = scrub.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
        const n = Math.round(p * words.length);
        if (n !== lit) {
          words.forEach((w, i) => w.classList.toggle("on", i < n));
          lit = n;
        }
      };
      new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active) update(); }).observe(scrub);
      let queued = false;
      window.addEventListener("scroll", () => {
        if (!active || queued) return;
        queued = true;
        requestAnimationFrame(() => { update(); queued = false; });
      }, { passive: true });
    }
  }

  /* ---------- active nav link ---------- */
  const links = new Map($$("#navLinks a").map((a) => [a.getAttribute("href").slice(1), a]));

  // desktop: one pill glides to the hovered link, then back to the current section's link
  const pill = $(".nav__pill");
  const navLinks = $("#navLinks");
  let activeLink = null;
  let hovering = false;
  const movePill = (a) => {
    if (!pill) return;
    if (!a || a.classList.contains("nav__cta-mobile")) { pill.style.opacity = "0"; return; }
    pill.style.width = `${a.offsetWidth}px`;
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
    pill.style.opacity = "1";
  };
  if (pill && finePointer) {
    links.forEach((a) => a.addEventListener("pointerenter", () => { hovering = true; movePill(a); }));
    navLinks.addEventListener("pointerleave", () => { hovering = false; movePill(activeLink); });
  }
  let pillQueued = false;
  window.addEventListener("resize", () => {
    if (pillQueued) return;
    pillQueued = true;
    requestAnimationFrame(() => { pillQueued = false; movePill(activeLink); });
  }, { passive: true });
  if (document.fonts) document.fonts.ready.then(() => movePill(activeLink));

  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("is-active"));
      const link = links.get(e.target.id);
      if (link) link.classList.add("is-active");
      activeLink = link || null;
      if (!hovering) movePill(activeLink);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionIO.observe(s));

  /* ---------- rotating role ---------- */
  const roles = [
    "found on Google",
    "more calls and enquiries",
    "a website that sells for you",
    "Instagram followers who buy",
    "every lead in one place",
    "paid online, on time",
    "a brand people remember",
  ];
  const rotator = $("#roleRotator");
  if (rotator && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      rotator.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % roles.length;
        rotator.textContent = roles[i];
        rotator.classList.remove("is-out");
      }, 350);
    }, 2600);
  }

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const to = Number(el.dataset.to);
      if (reduceMotion) { el.textContent = to; return; }
      const start = performance.now() + 700;
      const dur = 1400;
      const step = (now) => {
        const t = Math.min(Math.max((now - start) / dur, 0), 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$(".count").forEach((el) => countIO.observe(el));

  /* ---------- hero: live lead-tracking feed ---------- */
  const ICONS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
    form: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  };
  const TONES = {
    violet: ["rgba(139,92,246,.18)", "#c4b5fd"],
    cyan: ["rgba(34,211,238,.14)", "#67e8f9"],
    green: ["rgba(52,211,153,.15)", "#6ee7b7"],
    amber: ["rgba(251,191,36,.14)", "#fcd34d"],
  };
  const events = [
    { icon: "globe", tone: "cyan", title: "New visitor from Google", sub: "Looking at your services page" },
    { icon: "form", tone: "violet", title: "Enquiry form filled", sub: "Priya wants a price quote" },
    { icon: "sheet", tone: "green", title: "Added to your Google Sheet", sub: "New row: Priya · price quote" },
    { icon: "user", tone: "violet", title: "Saved to your CRM", sub: "Lead tracked · marked Hot" },
    { icon: "bell", tone: "amber", title: "Your team is notified", sub: "Assigned to Arun instantly" },
    { icon: "clock", tone: "cyan", title: "Follow-up reminder set", sub: "Call back today, 4:00 PM" },
    { icon: "card", tone: "green", title: "Payment received", sub: "₹4,999 paid online", win: true },
  ];
  const feed = $("#feed");
  const feedCount = $("#feedCount");
  const itemHTML = (ev) => {
    const [bg, fg] = TONES[ev.tone];
    return `<li class="feed__item"><span class="feed__icon" style="--tone:${bg};--tone-fg:${fg}"><svg viewBox="0 0 24 24">${ICONS[ev.icon]}</svg></span><div><b>${ev.title}</b><span>${ev.sub}</span></div><time>just now</time></li>`;
  };
  if (feed) {
    if (reduceMotion) {
      feed.innerHTML = events.slice(-4).reverse().map(itemHTML).join("");
    } else {
      let i = 0;
      let timer = null;
      const push = () => {
        const ev = events[i];
        feed.insertAdjacentHTML("afterbegin", itemHTML(ev));
        $$(".feed__item time", feed).forEach((t, k) => { t.textContent = k === 0 ? "just now" : `${k * 2} min ago`; });
        while (feed.children.length > 4) feed.lastElementChild.remove();
        if (ev.win && feedCount) {
          feedCount.textContent = Number(feedCount.textContent) + 1;
          feedCount.classList.add("bump");
          setTimeout(() => feedCount.classList.remove("bump"), 450);
        }
        i = (i + 1) % events.length;
        timer = setTimeout(push, ev.win ? 2600 : 1500);
      };
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) timer = setTimeout(push, 700);
        else if (!e.isIntersecting && timer) { clearTimeout(timer); timer = null; }
      }).observe(feed);
    }
  }

  /* ---------- step-by-step flows (each runs only while on screen) ---------- */
  $$("[data-stepper]").forEach((flow) => {
    const nodes = $$(".node", flow);
    const last = nodes.length - 1;
    const paint = (idx) => {
      flow.style.setProperty("--p", (idx / last).toFixed(3));
      nodes.forEach((n, i) => {
        n.classList.toggle("is-on", i <= idx);
        n.classList.toggle("is-live", idx === last && i === last);
      });
    };
    if (reduceMotion) { paint(last); return; }
    let idx = 0;
    let timer = null;
    const step = () => {
      paint(idx);
      const wait = idx === last ? 2400 : 750;
      idx = idx === last ? 0 : idx + 1;
      timer = setTimeout(step, wait);
    };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer) { idx = 0; step(); }
      else if (!e.isIntersecting && timer) { clearTimeout(timer); timer = null; }
    }, { threshold: 0.3 }).observe(flow);
  });

  /* ---------- Google search mock: type a search, then your business shows first ---------- */
  const gs = $("#gsearch");
  if (gs) {
    const q = $("#gsQuery");
    const cat = $("#gsCategory");
    const searches = [
      ["salon near me", "Salon"],
      ["best bakery near me", "Bakery"],
      ["interior designer near me", "Interior designer"],
      ["dental clinic near me", "Dental clinic"],
    ];
    if (reduceMotion) {
      q.textContent = searches[0][0];
      gs.classList.add("show");
    } else {
      let n = 0;
      let timer = null;
      const run = () => {
        const [text, category] = searches[n];
        n = (n + 1) % searches.length;
        gs.classList.remove("show");
        q.textContent = "";
        let k = 0;
        const type = () => {
          q.textContent = text.slice(0, ++k);
          if (k < text.length) { timer = setTimeout(type, 70); return; }
          cat.textContent = category;
          timer = setTimeout(() => {
            gs.classList.add("show");
            timer = setTimeout(run, 4200);
          }, 450);
        };
        timer = setTimeout(type, 500);
      };
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !timer) run();
        else if (!e.isIntersecting && timer) { clearTimeout(timer); timer = null; }
      }, { threshold: 0.3 }).observe(gs);
    }
  }

  /* ---------- lead capture demo: form → Google Sheet → alert ---------- */
  const lc = $("#leadDemo");
  if (lc) {
    const fields = {
      name: $('[data-f="name"]', lc),
      phone: $('[data-f="phone"]', lc),
      need: $('[data-f="need"]', lc),
    };
    const rows = $("#leadRows");
    const toastText = $("#leadToastText");
    const leads = [
      { name: "Priya S", phone: "98400 12345", masked: "98400 •••••", need: "Website for my bakery" },
      { name: "Arun K", phone: "90801 67890", masked: "90801 •••••", need: "Salon booking site" },
      { name: "Meena R", phone: "99520 24680", masked: "99520 •••••", need: "Interior design site" },
    ];
    let n = 0;
    let timers = [];
    let running = false;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const stop = () => { timers.forEach(clearTimeout); timers = []; running = false; };
    const typeInto = (el, text, done) => {
      el.classList.add("typing");
      let k = 0;
      const tick = () => {
        el.textContent = text.slice(0, ++k);
        if (k < text.length) later(tick, 45);
        else { el.classList.remove("typing"); later(done, 180); }
      };
      tick();
    };
    const cycle = () => {
      const lead = leads[n];
      n = (n + 1) % leads.length;
      lc.classList.remove("pressed", "sent", "alert");
      Object.values(fields).forEach((f) => { f.textContent = ""; });
      typeInto(fields.name, lead.name, () =>
        typeInto(fields.phone, lead.phone, () =>
          typeInto(fields.need, lead.need, () => {
            lc.classList.add("pressed");
            later(() => {
              lc.classList.remove("pressed");
              lc.classList.add("sent");
              later(() => {
                rows.insertAdjacentHTML("afterbegin",
                  `<div class="lc__row is-new" role="row"><span>${lead.name}</span><span>${lead.masked}</span><span>${lead.need}</span><span><i class="st st--new">New</i></span></div>`);
                while (rows.children.length > 4) rows.lastElementChild.remove();
                toastText.textContent = `${lead.name} · ${lead.need}`;
                lc.classList.add("alert");
                later(() => { const r = rows.firstElementChild; if (r) r.classList.add("fade"); }, 1400);
                later(() => lc.classList.remove("alert"), 2600);
                later(cycle, 3600);
              }, 700);
            }, 260);
          })));
    };
    if (reduceMotion) {
      fields.name.textContent = leads[0].name;
      fields.phone.textContent = leads[0].phone;
      fields.need.textContent = leads[0].need;
    } else {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; later(cycle, 500); }
        else if (!e.isIntersecting && running) stop();
      }, { threshold: 0.3 }).observe(lc);
    }
  }

  /* ---------- contact dock (phones: tap to open) ---------- */
  const dock = $("#dock");
  const dockToggle = $("#dockToggle");
  if (dock && dockToggle) {
    const setDock = (open) => {
      dock.classList.toggle("is-open", open);
      dockToggle.setAttribute("aria-expanded", String(open));
    };
    dockToggle.addEventListener("click", () => setDock(!dock.classList.contains("is-open")));
    // a tap outside, or on the dimmed backdrop (the dock itself), closes the menu
    document.addEventListener("click", (e) => { if (!dock.contains(e.target) || e.target === dock) setDock(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDock(false); });
  }

  /* ---------- quote form → Google Apps Script (Sheet row + email) ---------- */
  const qf = $("#quoteForm");
  if (qf) {
    const status = $("#quoteStatus");
    const done = $("#quoteDone");
    const shownAt = Date.now();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const checks = {
      name: (v) => v.length >= 2,
      phone: (v) => /^[0-9+()\-\s]{8,20}$/.test(v) && v.replace(/\D/g, "").length >= 8,
      email: (v) => EMAIL_RE.test(v),
    };
    const check = (input) => {
      const ok = checks[input.name](input.value.trim());
      const field = input.closest(".qf__field");
      field.classList.toggle("is-bad", !ok);
      field.classList.toggle("is-ok", ok);
      input.setAttribute("aria-invalid", String(!ok));
      return ok;
    };
    // validate a field only after the visitor has left it once, then live
    Object.keys(checks).forEach((name) => {
      const input = qf.elements[name];
      input.addEventListener("blur", () => { if (input.value.trim()) { input.dataset.touched = "1"; check(input); } });
      input.addEventListener("input", () => { if (input.dataset.touched) check(input); });
    });

    const collect = () => {
      const f = qf.elements;
      return {
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        email: f.email.value.trim(),
        business: f.business.value.trim(),
        services: $$('input[name="services"]:checked', qf).map((i) => i.value).join(", "),
        message: f.message.value.trim(),
        page: location.href.split("#")[0],
        website: f.website.value,
      };
    };
    const waFallback = (d) => {
      const text = `Hi Gokul, I'm ${d.name}${d.business ? ` from ${d.business}` : ""}. I need: ${d.services || "a website"}.` +
        `${d.message ? ` ${d.message}` : ""} Phone: ${d.phone}, Email: ${d.email}`;
      return `https://wa.me/917010217367?text=${encodeURIComponent(text)}`;
    };
    const showDone = (d) => {
      $("#quoteDoneName").textContent = d.name ? `, ${d.name.split(" ")[0]}` : "";
      qf.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    };

    qf.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (qf.classList.contains("is-sending")) return;
      status.textContent = "";
      const bad = Object.keys(checks).map((n) => qf.elements[n]).filter((i) => { i.dataset.touched = "1"; return !check(i); });
      if (bad.length) { bad[0].focus(); return; }

      const data = collect();
      // bots fill the hidden field or submit instantly: act as if it worked, send nothing
      if (data.website || Date.now() - shownAt < 2500) { showDone(data); return; }
      delete data.website;

      let endpoint = (qf.dataset.endpoint || "").trim();
      if (endpoint && !endpoint.startsWith("http")) {
        endpoint = `https://script.google.com/macros/s/${endpoint}/exec`;
      }
      const fail = () => {
        status.innerHTML = `Sorry, that didn't go through. <a href="${waFallback(data)}" target="_blank" rel="noopener">Send it on WhatsApp instead</a>, it takes one tap.`;
      };
      if (!endpoint) { console.warn("quoteForm: set data-endpoint to your Apps Script /exec URL or Deployment ID"); fail(); return; }

      qf.classList.add("is-sending");
      $(".qf__label", qf).textContent = "Sending…";
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        // text/plain keeps this a "simple" request, avoiding CORS preflight to Apps Script
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        let out = null;
        try {
          out = await res.json();
        } catch (_) {
          if (res.ok || res.type === "opaque") out = { ok: true };
        }
        if (out && !out.ok) throw new Error((out && out.error) || "failed");
        qf.reset();
        $$(".qf__field", qf).forEach((f) => f.classList.remove("is-ok", "is-bad"));
        showDone(data);
      } catch (err) {
        fail();
      } finally {
        clearTimeout(timer);
        qf.classList.remove("is-sending");
        $(".qf__label", qf).textContent = "Get my free quote";
      }
    });
  }

  /* ---------- images: until the real file is added, show the styled placeholder ---------- */
  $$(".media img").forEach((img) => {
    const markLoaded = () => img.closest(".media").classList.add("has-img");
    // no file yet: hide the whole box, so visitors never see an empty frame or a file name
    const drop = () => { img.closest(".media").classList.add("is-empty"); img.remove(); };
    if (img.complete) { img.naturalWidth ? markLoaded() : drop(); }
    else {
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", drop, { once: true });
    }
  });

  /* ---------- copy email ---------- */
  const copyBtn = $("#copyEmail");
  if (copyBtn) {
    const label = $("#copyLabel");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.email);
        copyBtn.classList.add("is-copied");
        label.textContent = "Copied";
      } catch {
        window.location.href = "mailto:" + copyBtn.dataset.email;
        return;
      }
      setTimeout(() => { copyBtn.classList.remove("is-copied"); label.textContent = "Copy"; }, 1800);
    });
  }

  /* ---------- pointer effects (desktop only) ---------- */
  if (!finePointer || reduceMotion) return;

  doc.classList.add("has-pointer");

  // cursor glow
  const glow = $(".cursor-glow");
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, glowRaf = null;
  const moveGlow = () => {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    glowRaf = Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5 ? requestAnimationFrame(moveGlow) : null;
  };
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!glowRaf) glowRaf = requestAnimationFrame(moveGlow);
  }, { passive: true });

  // card spotlight
  $$(".spot").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  });

  // magnetic buttons
  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--bx", `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
      btn.style.setProperty("--by", `${(e.clientY - r.top - r.height / 2) * 0.3}px`);
    }, { passive: true });
    btn.addEventListener("pointerleave", () => {
      btn.style.setProperty("--bx", "0px");
      btn.style.setProperty("--by", "0px");
    });
  });

  // project cards: 3D tilt
  $$(".project").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const k = card.classList.contains("project--feature") ? 3 : 7;
      card.style.setProperty("--ry", `${px * k}deg`);
      card.style.setProperty("--rx", `${-py * k}deg`);
      card.style.setProperty("--ty", "-4px");
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ty", "0px");
    });
  });

  // terminal tilt
  const tilt = $(".tilt");
  const visual = $(".hero__visual");
  if (tilt && visual) {
    visual.addEventListener("pointermove", (e) => {
      const r = visual.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.setProperty("--ry", `${px * 8}deg`);
      tilt.style.setProperty("--rx", `${-py * 8}deg`);
    }, { passive: true });
    visual.addEventListener("pointerleave", () => {
      tilt.style.setProperty("--ry", "0deg");
      tilt.style.setProperty("--rx", "0deg");
    });
  }
})();
