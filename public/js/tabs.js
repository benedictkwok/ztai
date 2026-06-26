import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@12/+esm";

const panels = {
  home: document.getElementById("panel-home"),
  blog: document.getElementById("panel-blog"),
  contact: document.getElementById("panel-contact"),
  founder: document.getElementById("panel-founder"),
};

const BLOG_SLUGS = {
  shadow_ai: "article-wrap-shadow",
  skills:    "article-wrap-skills",
};

let currentTab = "home";

function setTabBtnState(activeTab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    if (btn.dataset.tab) {
      btn.classList.toggle("tab-active", btn.dataset.tab === activeTab);
    } else {
      btn.classList.remove("tab-active"); // clear Platform / Consulting scroll buttons
    }
  });
}

function switchTab(newTab) {
  if (!panels[newTab] || newTab === currentTab) return;

  if (currentTab === "blog") history.pushState({}, "", window.location.pathname);

  const outEl = panels[currentTab];
  const inEl = panels[newTab];

  // Animate current panel out
  animate(outEl, { opacity: 0, y: -14 }, { duration: 0.2, ease: "easeIn" });

  setTimeout(() => {
    outEl.classList.add("hidden");
    outEl.style.cssText = ""; // clear Motion One inline styles

    // Prevent flash of unstyled content on reveal
    inEl.style.opacity = "0";
    inEl.classList.remove("hidden");

    // Animate new panel in
    animate(inEl, { opacity: [0, 1], y: [18, 0] }, { duration: 0.32, ease: "easeOut" });

    // Stagger-animate blog cards on blog tab entry
    if (newTab === "blog") {
      const cards = inEl.querySelectorAll(".blog-card");
      if (cards.length) {
        animate(
          cards,
          { opacity: [0, 1], y: [28, 0] },
          { delay: stagger(0.1), duration: 0.4, ease: "easeOut" }
        );
      }
    }

    // Stagger-animate founder sections on founder tab entry
    if (newTab === "founder") {
      const sections = inEl.querySelectorAll(".founder-section");
      if (sections.length) {
        animate(
          sections,
          { opacity: [0, 1], y: [20, 0] },
          { delay: stagger(0.08), duration: 0.35, ease: "easeOut" }
        );
      }
    }

    // Stagger-animate form groups on contact tab entry
    if (newTab === "contact") {
      const groups = inEl.querySelectorAll(".form-group");
      if (groups.length) {
        animate(
          groups,
          { opacity: [0, 1], y: [20, 0] },
          { delay: stagger(0.08), duration: 0.35, ease: "easeOut" }
        );
      }
    }

    currentTab = newTab;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 225);

  setTabBtnState(newTab);
}

// Wire panel tab button clicks
document.querySelectorAll("[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    if (tab === "home" && currentTab === "home") {
      // Already on home — just scroll to top and clear scroll-btn active states
      setTabBtnState("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    switchTab(tab);
  });
});

// Wire scroll-within-home buttons (Platform, Consulting)
document.querySelectorAll("[data-scroll]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.scroll;
    // Mark this button active, clear others
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("tab-active"));
    btn.classList.add("tab-active");

    const scrollToTarget = () => {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (currentTab !== "home") {
      switchTab("home");
      setTimeout(scrollToTarget, 430);
    } else {
      scrollToTarget();
    }
  });
});

// Logo: if not on home tab, switch back home and scroll to top
const logoLink = document.querySelector('a[href="#top"]');
if (logoLink) {
  logoLink.addEventListener("click", (e) => {
    if (currentTab !== "home") {
      e.preventDefault();
      switchTab("home");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 430);
    }
  });
}

// In-page anchor links: switch to home first if on another tab
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const href = link.getAttribute("href");
  if (href === "#top") return;
  link.addEventListener("click", (e) => {
    if (currentTab !== "home") {
      e.preventDefault();
      switchTab("home");
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }, 430);
    }
  });
});

// PDF download — uses html2pdf.js loaded globally via CDN script tag
window.downloadBlogPdf = function (elementId = "blog-post-main", filename = "ztai-ai-security-insights.pdf") {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (typeof html2pdf === "undefined") {
    console.error("html2pdf not yet loaded");
    return;
  }
  html2pdf()
    .set({
      margin: [10, 15, 10, 15],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#000000" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .save();
};

// Expose tab switcher for in-article CTA buttons
window.switchToTab = switchTab;

// Reveal and scroll to a full blog article section by wrapper ID
window.showBlogArticle = function (wrapperId) {
  const el = document.getElementById(wrapperId);
  if (!el) return;
  if (el.classList.contains("hidden")) {
    el.classList.remove("hidden");
    el.style.opacity = "0";
    animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4, ease: "easeOut" });
  }
  const slug = Object.keys(BLOG_SLUGS).find(k => BLOG_SLUGS[k] === wrapperId);
  if (slug) history.pushState({ blogname: slug }, "", `?blogname=${slug}`);
  setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
};

// ── Blog content unlock ────────────────────────────────────────────────────

// In-memory unlock flag — not inspectable in DevTools Application tab
let _unlocked = false;

// sessionStorage key (opaque name)
const _SK = "_zt";

// Build expected code at runtime from encoded segments — no plain-text literal
function _code() {
  return [atob("WlRBSQ=="), atob("QkVUQQ=="), atob("MjAyNg==")].join("-");
}

// Derive an opaque storage token from the code (reversal + salt + base64)
function _makeToken(c) {
  return btoa("unlock:" + [...c].reverse().join(""));
}

// On module load: silently restore unlock state from sessionStorage
function _restoreSession() {
  try {
    const stored = sessionStorage.getItem(_SK);
    if (stored && stored === _makeToken(_code())) {
      _unlocked = true;
      _applyUnlockedUI(false);
    }
  } catch { /* sessionStorage may be blocked in some privacy modes */ }
}

// Transform card UI from locked → early-access state
function _applyUnlockedUI(withAnim) {
  document.querySelectorAll("[data-locked]").forEach((card, i) => {
    const badge = card.querySelector(".lock-badge");
    const footer = card.querySelector(".lock-footer");
    const footerSpan = footer?.querySelector("span");
    const footerSvg = footer?.querySelector("svg");
    const delay = withAnim ? i * 70 : 0;

    setTimeout(() => {
      // Fade out and hide lock badge
      if (badge) {
        if (withAnim) animate(badge, { opacity: 0, scale: 0.5 }, { duration: 0.18 });
        setTimeout(() => { badge.style.display = "none"; }, withAnim ? 190 : 0);
      }
      // Swap icon to checkmark and update label
      if (footerSvg) {
        footerSvg.innerHTML = '<polyline points="20 6 9 17 4 12" stroke-width="2.5"/>';
      }
      if (footerSpan) footerSpan.textContent = "Early Access";
      if (footer) {
        footer.classList.remove("text-emerald-50/42");
        footer.classList.add("text-neon/70");
        if (withAnim) animate(footer, { opacity: [0.3, 1] }, { duration: 0.3 });
      }
    }, delay);
  });
}

// Show brief success toast
function _showToast() {
  const toast = document.getElementById("unlock-toast");
  if (!toast) return;
  toast.style.display = "block";
  animate(toast, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.3 });
  setTimeout(() => {
    animate(toast, { opacity: 0, y: -10 }, { duration: 0.25 });
    setTimeout(() => { toast.style.display = "none"; }, 260);
  }, 3500);
}

// Validate code, write obfuscated token to sessionStorage, update in-memory flag
window.attemptUnlock = function (input) {
  if (input.trim().toUpperCase() !== _code()) return false;
  _unlocked = true;
  try { sessionStorage.setItem(_SK, _makeToken(_code())); } catch { /* ok */ }
  _applyUnlockedUI(true);
  _showToast();
  return true;
};

// Called by the Unlock button in the modal
window.submitUnlockCode = function () {
  const inp = document.getElementById("unlock-code-input");
  const err = document.getElementById("unlock-error");
  if (!inp || !err) return;

  err.textContent = "";
  err.classList.add("hidden");

  if (!inp.value.trim()) {
    err.textContent = "Please enter your unlock code.";
    err.classList.remove("hidden");
    inp.focus();
    return;
  }

  if (window.attemptUnlock(inp.value)) {
    // Swap modal to unlocked confirmation state
    document.getElementById("sub-modal-locked").style.display = "none";
    const unlocked = document.getElementById("sub-modal-unlocked");
    unlocked.style.display = "block";
    animate(unlocked, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3 });
  } else {
    err.textContent = "Invalid code. Please check your email and try again.";
    err.classList.remove("hidden");
    animate(inp, { x: [-5, 5, -4, 4, 0] }, { duration: 0.35 });
    inp.value = "";
    inp.focus();
  }
};

// Restore session on module init
_restoreSession();

// Deep-link: ?blogname=shadow_ai opens the blog tab and reveals the article
(function handleDeepLink() {
  const slug = new URLSearchParams(window.location.search).get("blogname");
  if (!slug || !BLOG_SLUGS[slug]) return;
  switchTab("blog");
  setTimeout(() => window.showBlogArticle(BLOG_SLUGS[slug]), 450);
})();


// ── Subscriber gate modal ──────────────────────────────────────────────────

const subModal = document.getElementById("sub-modal");
const subBackdrop = document.getElementById("sub-backdrop");
const subPanel = document.getElementById("sub-modal-panel");
let subModalTrigger = null;

window.openSubModal = function (triggerEl) {
  subModalTrigger = triggerEl || document.activeElement;

  // Swap modal content based on unlock state
  document.getElementById("sub-modal-locked").style.display = _unlocked ? "none" : "block";
  document.getElementById("sub-modal-unlocked").style.display = _unlocked ? "block" : "none";

  // Reset code input on each open
  const inp = document.getElementById("unlock-code-input");
  const err = document.getElementById("unlock-error");
  if (inp) inp.value = "";
  if (err) { err.textContent = ""; err.classList.add("hidden"); }

  subModal.style.display = "flex";
  animate(subBackdrop, { opacity: [0, 1] }, { duration: 0.22 });
  animate(subPanel, { opacity: [0, 1], scale: [0.94, 1], y: [12, 0] }, { duration: 0.28, ease: "easeOut" });
  setTimeout(() => document.getElementById("sub-modal-close").focus(), 50);
};

window.closeSubModal = function () {
  animate(subPanel, { opacity: 0, scale: 0.95, y: 8 }, { duration: 0.16, ease: "easeIn" });
  animate(subBackdrop, { opacity: 0 }, { duration: 0.16 });
  setTimeout(() => {
    subModal.style.display = "none";
    // Return focus to the card that opened the modal
    if (subModalTrigger && typeof subModalTrigger.focus === "function") {
      subModalTrigger.focus();
    }
    subModalTrigger = null;
  }, 170);
};

// Close on backdrop click
subBackdrop.addEventListener("click", window.closeSubModal);

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && subModal.style.display !== "none") {
    window.closeSubModal();
  }
});

// ── Contact form ─────────────────────────────────────────────────────────────

const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");
const contactSuccess = document.getElementById("contactSuccess");

function showFieldErr(id, msg) {
  const errEl = document.getElementById("err-" + id);
  const inputEl = document.getElementById("cf-" + id);
  if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
  if (inputEl) inputEl.classList.add("input-error");
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com",
  "yahoo.com","ymail.com","aol.com","icloud.com","me.com","mac.com",
  "protonmail.com","proton.me","mail.com","gmx.com","gmx.net","zohomail.com",
  "qq.com","163.com","126.com","sina.com","sohu.com",
]);

function isPersonalEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? PERSONAL_EMAIL_DOMAINS.has(domain) : false;
}

function clearContactErrors() {
  ["name", "company", "email", "website", "message"].forEach((id) => {
    const errEl = document.getElementById("err-" + id);
    const inputEl = document.getElementById("cf-" + id);
    if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }
    if (inputEl) inputEl.classList.remove("input-error");
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearContactErrors();

    const name = document.getElementById("cf-name").value.trim();
    const company = document.getElementById("cf-company").value.trim();
    const email = document.getElementById("cf-email").value.trim();
    const website = document.getElementById("cf-website").value.trim();
    const message = document.getElementById("cf-message").value.trim();

    let ok = true;
    if (!name) { showFieldErr("name", "Full name is required."); ok = false; }
    if (!company) { showFieldErr("company", "Company name is required."); ok = false; }
    if (!email) {
      showFieldErr("email", "Work email is required."); ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldErr("email", "Enter a valid email address."); ok = false;
    } else if (isPersonalEmail(email)) {
      showFieldErr("email", "Please use your company email address. Personal email providers are not accepted."); ok = false;
    }
    if (!website) {
      showFieldErr("website", "Company website is required."); ok = false;
    } else if (!/^https?:\/\/.+\..+/.test(website)) {
      showFieldErr("website", "Enter a valid URL (e.g. https://acme.com)."); ok = false;
    }
    if (!message) { showFieldErr("message", "Message is required."); ok = false; }
    if (!ok) return;

    contactStatus.textContent = "transmitting...";
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, company, email, website, message }),
      });

      if (res.ok) {
        contactStatus.textContent = "transmitted";
        contactSuccess.classList.remove("hidden");
        animate(contactSuccess, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.3 });
        contactForm.reset();
        setTimeout(() => {
          contactStatus.textContent = "standby";
          contactSuccess.classList.add("hidden");
        }, 5000);
      } else {
        contactStatus.textContent = "error";
        showFieldErr("message", "Submission failed. Please try again.");
      }
    } catch {
      contactStatus.textContent = "offline";
      showFieldErr("message", "Network error. Check your connection.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
