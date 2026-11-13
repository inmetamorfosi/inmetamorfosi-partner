/* inMetamorfosi — Pagina Partner 2.0 */
(function () {
  "use strict";

  /* ---------- anno corrente nel footer ---------- */
  var yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- sticky CTA mobile (appare dopo l'hero, sparisce sul form) ---------- */
  var sticky = document.getElementById("sticky-cta");
  var hero = document.querySelector(".hero");
  var formSec = document.getElementById("candidati");
  if (sticky && hero && formSec) {
    window.addEventListener("scroll", function () {
      var pastHero = window.scrollY > hero.offsetHeight;
      var formTop = formSec.getBoundingClientRect().top;
      sticky.classList.toggle("visible", pastHero && formTop > window.innerHeight * 0.6);
    }, { passive: true });
  }

  /* ---------- approfondimenti che si aprono con un pulsante (e-commerce, tabella sconti) ---------- */
  document.querySelectorAll(".pc-more").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.textContent = btn.getAttribute(open ? "data-open" : "data-close");
      panel.hidden = open;
      if (!open) {
        panel.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ---------- tracking CTA ---------- */
  document.querySelectorAll("[data-cta]").forEach(function (el) {
    el.addEventListener("click", function () {
      var name = el.getAttribute("data-cta");
      if (window.dataLayer) window.dataLayer.push({ event: "cta_click", cta: name, page: "partner" });
      if (window.fbq) window.fbq("trackCustom", "CTAClick", { cta: name, page: "partner" });
    });
  });

  /* ---------- configuratore preventivo ----------
     Listino IVA esclusa. Quota partner = 30% dell'imponibile.
     Sconto 5/10/15%: prezzo arrotondato alla decina, quota arrotondata ai 5 €. */
  var PRICE = { one: 1100, full: 2200, shop: 2500 };
  var EXTRA_PAGE = 150;
  var QUOTA = 0.30;
  var IVA = 0.22;

  var prodEls = document.querySelectorAll('input[name="c-prod"]'),
      pagesWrap = document.getElementById("c-pages-wrap"),
      pages = document.getElementById("c-pages"),
      pagesOut = document.getElementById("c-pages-out"),
      mods = document.querySelectorAll(".c-mod"),
      modGroups = document.querySelectorAll(".mod-checks[data-for]"),
      itemsWrap = document.getElementById("c-items-wrap"),
      items = document.getElementById("c-items"),
      discEls = document.querySelectorAll('input[name="c-disc"]'),
      n = document.getElementById("c-n"),
      nOut = document.getElementById("c-n-out"),
      outNet = document.getElementById("c-net"),
      outGross = document.getElementById("c-gross"),
      outHost = document.getElementById("c-host"),
      outQuota = document.getElementById("c-quota"),
      outMonth = document.getElementById("c-month");

  // formato italiano: punto per le migliaia, virgola per i decimali (solo se servono)
  function eur(v) {
    var cents = Math.round(v * 100);
    var int = Math.floor(cents / 100), dec = cents % 100;
    var s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (dec) s += "," + (dec < 10 ? "0" : "") + dec;
    return s + " €";
  }

  function calc() {
    var prod = document.querySelector('input[name="c-prod"]:checked').value;
    var net = PRICE[prod];
    var group = prod === "shop" ? "shop" : "site";
    pagesWrap.hidden = prod !== "full";
    itemsWrap.hidden = prod !== "shop";
    if (outHost) outHost.textContent = prod === "shop"
      ? "+ dominio ed email, se non li ha: 60 € + IVA il primo anno, poi 90 € + IVA di rinnovo annuale. + Shopify, indicativamente 39 € al mese"
      : "+ dominio e hosting, se non li ha: 60 € + IVA il primo anno, poi rinnovo annuale a 90 € + IVA";
    if (prod === "full") net += (parseInt(pages.value, 10) - 5) * EXTRA_PAGE;
    if (prod === "shop") net += parseFloat(items.value);
    pagesOut.textContent = pages.value;

    // solo i moduli del prodotto scelto: quelli dell'altro gruppo si nascondono e si azzerano
    modGroups.forEach(function (g) {
      var on = g.getAttribute("data-for") === group;
      g.hidden = !on;
      g.querySelectorAll(".c-mod").forEach(function (m) {
        if (!on) m.checked = false;
        else if (m.checked) net += parseFloat(m.value);
      });
    });

    var d = parseInt(document.querySelector('input[name="c-disc"]:checked').value, 10);
    if (d) net = Math.round(net * (1 - d / 100) / 10) * 10;

    var quota = Math.round(net * QUOTA / 5) * 5;
    var k = parseInt(n.value, 10);
    nOut.textContent = k;

    outNet.textContent = eur(net) + " + IVA";
    outGross.textContent = "Totale con IVA 22%: " + eur(net * (1 + IVA));
    outQuota.textContent = eur(quota);
    outMonth.textContent = "= " + eur(quota * k) + " al mese, circa " + eur(quota * k * 12) + " in un anno";
  }

  if (outNet && pages && n && items) {
    var inputs = [pages, n, items].concat(Array.prototype.slice.call(prodEls), Array.prototype.slice.call(mods), Array.prototype.slice.call(discEls));
    inputs.forEach(function (el) { el.addEventListener("input", calc); el.addEventListener("change", calc); });
    calc();
  }

  /* ---------- form candidatura (Zoho Web-to-Lead "Ricerca agenti") ---------- */
  var form = document.getElementById("webform660414000017976065");
  if (!form) return;
  var msg = document.getElementById("form-msg");
  var btn = document.getElementById("submit-btn");

  form.addEventListener("submit", function (ev) {
    // validazione
    var valid = true;
    form.querySelectorAll("[required]").forEach(function (f) {
      var ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "";
      if (f.type === "email" && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim());
      // curriculum: PDF o Word, massimo 5 MB
      if (f.type === "file" && ok) {
        var file = f.files[0];
        ok = !!file && /\.(pdf|docx?)$/i.test(file.name) && file.size <= 5 * 1024 * 1024;
      }
      f.classList.toggle("error", !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      ev.preventDefault();
      msg.textContent = "Compila tutti i campi obbligatori: email valida, curriculum (PDF o Word, massimo 5 MB) e consenso privacy.";
      msg.className = "form-msg err";
      return;
    }

    // eventi tracking
    if (window.dataLayer) window.dataLayer.push({ event: "lead_submit", form: "pagina-partner" });
    if (window.fbq) window.fbq("track", "Lead", { content_name: "pagina-partner" });

    // evita invii doppi; il POST nativo va a Zoho, che reindirizza a grazie.html
    btn.disabled = true;
    btn.textContent = "Invio in corso…";
  });

  // se l'utente torna indietro dalla pagina di conferma, il pulsante deve essere di nuovo attivo
  window.addEventListener("pageshow", function () {
    btn.disabled = false;
    btn.textContent = "Invia la candidatura →";
  });
})();
