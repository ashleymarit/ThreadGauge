(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var tickets = Array.prototype.slice.call(document.querySelectorAll("[data-ticket]"));
  var lockers = Array.prototype.slice.call(document.querySelectorAll("[data-locker]"));
  var needles = Array.prototype.slice.call(document.querySelectorAll("[data-needle]"));
  var scrawls = Array.prototype.slice.call(document.querySelectorAll("[data-grease]"));
  var observers = [];

  initNav();
  initLockers();
  initForm();

  if (motion.matches || !("IntersectionObserver" in window)) {
    finishMotion();
    return;
  }

  observeTickets();
  observeScrawls();

  if (motion.addEventListener) {
    motion.addEventListener("change", function (event) {
      if (event.matches) finishMotion();
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("shop-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
    });
  }

  function initLockers() {
    lockers.forEach(function (button) {
      button.addEventListener("click", function () {
        var unit = button.closest(".locker-unit");
        var bin = unit ? unit.querySelector(".locker-bin") : null;
        if (!bin) return;
        var open = button.getAttribute("aria-expanded") === "true";
        closeLockers();
        if (!open) {
          button.setAttribute("aria-expanded", "true");
          bin.hidden = false;
        }
      });
    });

    if (window.location.hash) {
      var target = document.querySelector(window.location.hash);
      var button = target ? target.querySelector("[data-locker]") : null;
      if (button) button.click();
    }
  }

  function closeLockers() {
    lockers.forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
      var unit = button.closest(".locker-unit");
      var bin = unit ? unit.querySelector(".locker-bin") : null;
      if (bin) bin.hidden = true;
    });
  }

  function initForm() {
    var form = document.getElementById("bay-ticket");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var ack = document.getElementById("form-ack");
      form.classList.add("is-stamped", "is-drawn");
      if (ack) ack.hidden = false;
    });
  }

  function observeTickets() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runTicket(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.28 });

    tickets.forEach(function (ticket) {
      observer.observe(ticket);
    });
    observers.push(observer);
  }

  function observeScrawls() {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-drawn");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    scrawls.forEach(function (el) {
      observer.observe(el);
    });
    observers.push(observer);
  }

  function runTicket(ticket) {
    if (ticket.dataset.played === "true") return;
    ticket.dataset.played = "true";

    if (ticket.tagName === "FORM") {
      ticket.classList.add("is-stamped");
      return;
    }

    var fills = Array.prototype.slice.call(ticket.querySelectorAll("[data-fill]"));
    var stored = fills.map(function (el) {
      return el.textContent;
    });

    fills.forEach(function (el) {
      el.textContent = "";
    });

    window.setTimeout(function () {
      ticket.classList.add("is-stamped");
      settleNeedles();
      typeFields(ticket, fills, stored, 0);
    }, 280);
  }

  function typeFields(ticket, fills, stored, index) {
    if (motion.matches) {
      fills.forEach(function (el, i) {
        el.textContent = stored[i];
      });
      ticket.classList.add("is-filling", "is-drawn");
      return;
    }

    if (index >= fills.length) {
      ticket.classList.add("is-drawn");
      return;
    }

    ticket.classList.add("is-filling");
    var el = fills[index];
    var text = stored[index] || "";
    var cursor = 0;

    function step() {
      if (motion.matches) {
        el.textContent = text;
        typeFields(ticket, fills, stored, index + 1);
        return;
      }
      if (cursor >= text.length) {
        window.setTimeout(function () {
          typeFields(ticket, fills, stored, index + 1);
        }, 160);
        return;
      }
      el.textContent += text.charAt(cursor);
      cursor += 1;
      window.setTimeout(step, /[,.]/.test(text.charAt(cursor - 1)) ? 90 : 28);
    }

    step();
  }

  function settleNeedles() {
    needles.forEach(function (needle) {
      needle.classList.add("is-settled");
    });
  }

  function finishMotion() {
    observers.forEach(function (observer) {
      observer.disconnect();
    });
    tickets.forEach(function (ticket) {
      ticket.classList.add("is-stamped", "is-filling", "is-drawn");
      ticket.dataset.played = "true";
      Array.prototype.slice.call(ticket.querySelectorAll("[data-fill]")).forEach(function (el) {
        if (!el.textContent) el.textContent = el.getAttribute("data-fill") || el.textContent;
      });
    });
    scrawls.forEach(function (el) {
      el.classList.add("is-drawn");
    });
    settleNeedles();
  }
})();
