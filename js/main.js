(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Enquiry form (EmailJS) ---------- */
  const enquiryForm = document.getElementById("enquiryForm");
  if (enquiryForm) {
    const config = window.EMAILJS_CONFIG || {};
    const submitBtn = document.getElementById("enqSubmit");
    const statusEl = document.getElementById("enqStatus");
    let emailjsReady = false;

    function initEmailJs() {
      if (emailjsReady || !window.emailjs) return emailjsReady;
      window.emailjs.init({ publicKey: config.publicKey });
      emailjsReady = true;
      return true;
    }

    function setStatus(type, message) {
      statusEl.className = "form-status mt-3" + (type ? " is-" + type : "");
      statusEl.innerHTML = message
        ? '<i class="bi ' + (type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill") + ' me-2" aria-hidden="true"></i>' + message
        : "";
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle("is-loading", loading);
    }

    const mobileInput = enquiryForm.elements.mobile;
    const countrySelect = enquiryForm.elements.country;
    const mobileError = document.getElementById("enqMobileError");
    function selectedCountry() {
      const opt = countrySelect.options[countrySelect.selectedIndex];
      return { code: opt.value, min: Number(opt.dataset.min), max: Number(opt.dataset.max) };
    }
    function normalizedMobile() {
      const code = selectedCountry().code.replace("+", "");
      return mobileInput.value
        .replace(/[\s()-]/g, "")
        .replace(new RegExp("^(\\+" + code + "|00" + code + ")"), "")
        .replace(/^0+/, "");
    }
    function validateMobile() {
      const { code, min, max } = selectedCountry();
      const digits = normalizedMobile();
      let ok = /^\d+$/.test(digits) && digits.length >= min && digits.length <= max;
      if (code === "+91") ok = ok && /^[6-9]/.test(digits);
      mobileInput.setCustomValidity(ok ? "" : "invalid");
      if (mobileError) {
        const len = min === max ? min : min + "–" + max;
        mobileError.textContent = "Please enter a valid " + len + "-digit mobile number for " + code + ".";
      }
    }
    mobileInput.addEventListener("input", validateMobile);
    countrySelect.addEventListener("change", validateMobile);

    (function enhanceCountrySelect() {
      const flagUrl = (iso) => "https://flagcdn.com/w40/" + iso + ".png";
      const el = (tag, cls) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        return node;
      };

      const picker = el("div", "country-picker");
      const trigger = el("button", "country-trigger");
      trigger.type = "button";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      const triggerFlag = el("img", "country-flag");
      triggerFlag.alt = "";
      triggerFlag.width = 22;
      triggerFlag.height = 16;
      const triggerCode = el("span", "country-trigger-code");
      const chevron = el("i", "bi bi-chevron-down country-chevron");
      chevron.setAttribute("aria-hidden", "true");
      trigger.append(triggerFlag, triggerCode, chevron);

      const menu = el("div", "country-menu");
      menu.hidden = true;
      const searchWrap = el("div", "country-search");
      const searchIcon = el("i", "bi bi-search");
      searchIcon.setAttribute("aria-hidden", "true");
      const search = el("input");
      search.type = "text";
      search.placeholder = "Search country or code";
      search.setAttribute("aria-label", "Search country");
      search.autocomplete = "off";
      searchWrap.append(searchIcon, search);
      const list = el("ul", "country-list");
      list.setAttribute("role", "listbox");
      list.id = "enqCountryList";
      trigger.setAttribute("aria-controls", list.id);
      const empty = el("li", "country-empty");
      empty.textContent = "No matches";
      empty.hidden = true;
      menu.append(searchWrap, list);

      const items = Array.from(countrySelect.options).map(function (opt, index) {
        const li = el("li", "country-option");
        li.setAttribute("role", "option");
        li.id = "enqCountryOpt" + index;
        li.dataset.index = index;
        li.dataset.search = (opt.dataset.name + " " + opt.value + " " + opt.dataset.iso).toLowerCase();
        const flag = el("img", "country-flag");
        flag.src = flagUrl(opt.dataset.iso);
        flag.alt = "";
        flag.width = 22;
        flag.height = 16;
        flag.loading = "lazy";
        const name = el("span", "country-name");
        name.textContent = opt.dataset.name;
        const code = el("span", "country-code");
        code.textContent = opt.value;
        const check = el("i", "bi bi-check2 country-check");
        check.setAttribute("aria-hidden", "true");
        li.append(flag, name, code, check);
        list.append(li);
        return li;
      });
      list.append(empty);

      let activeIndex = -1;

      function sync() {
        const opt = countrySelect.options[countrySelect.selectedIndex];
        triggerFlag.src = flagUrl(opt.dataset.iso);
        triggerCode.textContent = opt.value;
        trigger.setAttribute("aria-label", "Country code: " + opt.dataset.name + " " + opt.value);
        items.forEach(function (li, i) {
          li.setAttribute("aria-selected", i === countrySelect.selectedIndex ? "true" : "false");
        });
      }

      function visibleItems() {
        return items.filter((li) => !li.hidden);
      }

      function setActive(li, scroll = true) {
        items.forEach((item) => item.classList.remove("is-active"));
        if (!li) {
          activeIndex = -1;
          search.removeAttribute("aria-activedescendant");
          return;
        }
        li.classList.add("is-active");
        activeIndex = Number(li.dataset.index);
        search.setAttribute("aria-activedescendant", li.id);
        if (scroll) li.scrollIntoView({ block: "nearest" });
      }

      function open() {
        if (!menu.hidden) return;
        menu.hidden = false;
        picker.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        search.value = "";
        filter();
        setActive(items[countrySelect.selectedIndex]);
        search.focus();
      }

      function close(focusTrigger) {
        if (menu.hidden) return;
        menu.hidden = true;
        picker.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        if (focusTrigger) trigger.focus();
      }

      function choose(index) {
        if (countrySelect.selectedIndex !== index) {
          countrySelect.selectedIndex = index;
          countrySelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
        sync();
        close(false);
        mobileInput.focus();
      }

      function filter() {
        const q = search.value.trim().toLowerCase().replace(/^\+/, "");
        items.forEach(function (li) {
          li.hidden = q !== "" && !li.dataset.search.includes(q);
        });
        const visible = visibleItems();
        empty.hidden = visible.length > 0;
        if (!visible.some((li) => Number(li.dataset.index) === activeIndex)) setActive(visible[0]);
      }

      trigger.addEventListener("click", function () {
        menu.hidden ? open() : close(true);
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          open();
        }
      });
      search.addEventListener("input", filter);
      search.addEventListener("keydown", function (e) {
        const visible = visibleItems();
        const pos = visible.findIndex((li) => Number(li.dataset.index) === activeIndex);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive(visible[Math.min(pos + 1, visible.length - 1)]);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive(visible[Math.max(pos - 1, 0)]);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0) choose(activeIndex);
        } else if (e.key === "Escape") {
          e.preventDefault();
          close(true);
        } else if (e.key === "Tab") {
          close(false);
        }
      });
      list.addEventListener("click", function (e) {
        const li = e.target.closest(".country-option");
        if (li) choose(Number(li.dataset.index));
      });
      list.addEventListener("mousemove", function (e) {
        const li = e.target.closest(".country-option");
        if (li && Number(li.dataset.index) !== activeIndex) setActive(li, false);
      });
      document.addEventListener("pointerdown", function (e) {
        if (!picker.contains(e.target)) close(false);
      });
      enquiryForm.addEventListener("reset", function () {
        setTimeout(sync);
      });

      picker.append(trigger, menu);
      countrySelect.before(picker);
      countrySelect.classList.add("is-enhanced");
      countrySelect.tabIndex = -1;
      countrySelect.setAttribute("aria-hidden", "true");
      sync();
    })();

    const emailInput = enquiryForm.elements.email;
    function validateEmail() {
      emailInput.setCustomValidity(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.value.trim()) ? "" : "invalid");
    }
    emailInput.addEventListener("input", validateEmail);

    enquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", "");

      validateMobile();
      validateEmail();
      enquiryForm.classList.add("was-validated");
      if (!enquiryForm.checkValidity()) {
        const firstInvalid = enquiryForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (enquiryForm.elements.website.value) return;

      if (!initEmailJs()) {
        setStatus("error", "Email service is still loading. Please try again in a moment or WhatsApp us.");
        return;
      }

      const params = {
        name: enquiryForm.elements.name.value.trim(),
        mobile: selectedCountry().code + " " + normalizedMobile(),
        email: emailInput.value.trim(),
        address: enquiryForm.elements.address.value.trim(),
        remarks: enquiryForm.elements.remarks.value.trim() || "—",
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      };
      params.reply_to = params.email;
      params.title = "New website enquiry from " + params.name;
      params.message =
        "Name: " + params.name +
        "\nMobile: " + params.mobile +
        "\nEmail: " + params.email +
        "\nAddress: " + params.address +
        "\nRemarks: " + params.remarks;

      setLoading(true);
      window.emailjs
        .send(config.serviceId, config.templateId, params)
        .then(function () {
          if (config.autoReplyTemplateId) {
            window.emailjs.send(config.serviceId, config.autoReplyTemplateId, params).catch(function (err) {
              console.warn("EmailJS auto-reply failed:", err);
            });
          }
          setStatus("success", "Thank you, " + params.name.replace(/[<>&"']/g, "") + "! Your enquiry has been sent. We’ll contact you shortly.");
          enquiryForm.reset();
          enquiryForm.classList.remove("was-validated");
        })
        .catch(function (err) {
          console.error("EmailJS error:", err);
          setStatus(
            "error",
            'Sorry, we couldn’t send your enquiry. Please try again or <a href="https://wa.me/919894634748" target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.'
          );
        })
        .finally(function () {
          setLoading(false);
        });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Light / dark theme ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeMeta = document.getElementById("themeColorMeta");
  const THEME_KEY = "zigi-theme";

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-bs-theme", theme);
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f6f8ff" : "#05060f");
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const next = currentTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}

      if (document.startViewTransition && !prefersReducedMotion) {
        const rect = themeToggle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const transition = document.startViewTransition(function () {
          applyTheme(next);
        });
        transition.ready.then(function () {
          root.animate(
            {
              clipPath: [
                "circle(0px at " + x + "px " + y + "px)",
                "circle(" + radius + "px at " + x + "px " + y + "px)"
              ]
            },
            { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
          );
        });
      } else {
        root.classList.add("theme-fade");
        applyTheme(next);
        setTimeout(function () {
          root.classList.remove("theme-fade");
        }, 550);
      }
    });
  }

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
    if (!storedTheme()) applyTheme(e.matches ? "light" : "dark");
  });

  /* ---------- Hero headline word split ---------- */
  function splitWords(el) {
    const frag = document.createDocumentFragment();
    let index = 0;
    Array.from(el.childNodes).forEach(function (node) {
      if (node.nodeName === "BR") {
        frag.appendChild(node.cloneNode());
        return;
      }
      const extraClass = node.nodeType === 1 ? " " + node.className : "";
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        const outer = document.createElement("span");
        outer.className = "word";
        const inner = document.createElement("span");
        inner.className = "word-inner" + extraClass;
        inner.style.transitionDelay = 200 + index * 70 + "ms";
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
        index++;
      });
    });
    el.textContent = "";
    el.appendChild(frag);
  }

  const splitTargets = document.querySelectorAll("[data-split]");
  if (!prefersReducedMotion) {
    splitTargets.forEach(splitWords);
  }

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById("preloader");
  const startTime = performance.now();
  let preloaderDone = false;

  function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    const wait = Math.max(0, 600 - (performance.now() - startTime));
    setTimeout(function () {
      if (preloader) preloader.classList.add("is-hidden");
      splitTargets.forEach(function (el) {
        el.classList.add("is-revealed");
      });
    }, wait);
  }

  if (document.readyState === "complete") {
    finishPreloader();
  } else {
    window.addEventListener("load", finishPreloader, { once: true });
  }
  setTimeout(finishPreloader, 1400);

  /* ---------- Scroll: navbar, progress, active link, back-to-top, parallax ---------- */
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".navbar .nav-link");
  const progressBar = document.getElementById("scrollProgressBar");
  const backToTop = document.getElementById("backToTop");
  const bttProgress = document.getElementById("bttProgress");
  const bttLength = 2 * Math.PI * 21;
  const trackedSections = document.querySelectorAll("main > header[id], main > section[id]");
  const parallaxEls = prefersReducedMotion ? [] : document.querySelectorAll("[data-parallax]");
  let scrollTicking = false;

  function updateOnScroll() {
    scrollTicking = false;
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    if (navbar) navbar.classList.toggle("scrolled", scrollY > 24);
    if (progressBar) progressBar.style.width = ratio * 100 + "%";

    if (backToTop) backToTop.classList.toggle("is-visible", scrollY > 600);
    if (bttProgress) bttProgress.style.strokeDashoffset = String(bttLength * (1 - ratio));

    parallaxEls.forEach(function (el) {
      const speed = parseFloat(el.getAttribute("data-parallax")) || 0;
      el.style.transform = "translate3d(0," + scrollY * speed + "px,0)";
    });

    const probe = scrollY + 160;
    let currentId = null;
    trackedSections.forEach(function (section) {
      if (probe >= section.offsetTop && probe < section.offsetTop + section.offsetHeight) {
        currentId = section.id;
      }
    });
    if (currentId) {
      navLinks.forEach(function (link) {
        link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
      });
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateOnScroll);
      }
    },
    { passive: true }
  );
  updateOnScroll();

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (!targetId || targetId.length < 2) return;
      const el = document.querySelector(targetId);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      const collapse = document.querySelector(".navbar-collapse.show");
      if (collapse && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
      }
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealElements = document.querySelectorAll(".reveal-on-scroll");
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const delay = parseInt(entry.target.getAttribute("data-delay") || "0", 10);
          if (delay > 0) entry.target.style.transitionDelay = delay + "ms";
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute("data-count") || "0", 10);
    const suffix = el.getAttribute("data-suffix") || "";
    if (!target || prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1800;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll(".stat-number[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (c) {
      counterObserver.observe(c);
    });
  }

  /* ---------- Typewriter ---------- */
  const typewriterEl = document.getElementById("typewriterText");
  if (typewriterEl && !prefersReducedMotion) {
    const phrases = [
      "business websites",
      "e-commerce stores",
      "landing pages",
      "custom web apps",
      "website redesigns"
    ];
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let deleting = true;

    function tick() {
      const phrase = phrases[phraseIndex];
      let delay = deleting ? 40 : 80;
      if (!deleting && charIndex < phrase.length) {
        charIndex++;
      } else if (deleting && charIndex > 0) {
        charIndex--;
      } else if (!deleting) {
        deleting = true;
        delay = 2000;
      } else {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 300;
      }
      typewriterEl.textContent = phrases[phraseIndex].substring(0, charIndex);
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2600);
  }

  /* ---------- Pointer effects ---------- */
  if (canHover && !prefersReducedMotion) {
    const glow = document.getElementById("cursorGlow");
    const ring = document.getElementById("cursorRing");
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pointer.x, y: pointer.y };
    let pointerSeen = false;

    window.addEventListener(
      "pointermove",
      function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        if (!pointerSeen) {
          pointerSeen = true;
          ringPos.x = pointer.x;
          ringPos.y = pointer.y;
          if (glow) glow.style.opacity = "1";
          if (ring) ring.style.opacity = "1";
        }
        const card = e.target.closest && e.target.closest(".glass-card");
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mouse-x", e.clientX - rect.left + "px");
          card.style.setProperty("--mouse-y", e.clientY - rect.top + "px");
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", function () {
      if (glow) glow.style.opacity = "0";
      if (ring) ring.style.opacity = "0";
      pointerSeen = false;
    });

    document.querySelectorAll("a, button, [data-tilt]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        if (ring) ring.classList.add("is-active");
      });
      el.addEventListener("mouseleave", function () {
        if (ring) ring.classList.remove("is-active");
      });
    });

    (function followPointer() {
      ringPos.x += (pointer.x - ringPos.x) * 0.18;
      ringPos.y += (pointer.y - ringPos.y) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + ringPos.x + "px," + ringPos.y + "px,0)";
      if (glow) glow.style.transform = "translate3d(" + pointer.x + "px," + pointer.y + "px,0)";
      requestAnimationFrame(followPointer);
    })();

    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        const rect = el.getBoundingClientRect();
        const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        el.style.transform =
          "perspective(1000px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-6px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });

    document.querySelectorAll(".btn-magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.28 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------- Hero particle constellation ---------- */
  const canvas = document.getElementById("heroCanvas");
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    const hero = document.getElementById("home");
    const mouse = { x: null, y: null, radius: 140 };
    const linkDistance = 140;
    let width = 0;
    let height = 0;
    let particles = [];
    let running = false;
    let heroVisible = true;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero.offsetWidth;
      height = hero.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.max(24, Math.floor((width * height) / 20000)));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          size: Math.random() * 1.8 + 0.8,
          alt: i % 3 === 0
        });
      }
    }

    const palette = { a: "", b: "", link: "" };
    function readPalette() {
      const styles = getComputedStyle(root);
      palette.a = styles.getPropertyValue("--particle-a").trim();
      palette.b = styles.getPropertyValue("--particle-b").trim();
      palette.link = styles.getPropertyValue("--particle-link").trim();
    }
    readPalette();
    new MutationObserver(readPalette).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    hero.addEventListener(
      "pointermove",
      function (e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      },
      { passive: true }
    );
    hero.addEventListener("pointerleave", function () {
      mouse.x = null;
      mouse.y = null;
    });

    function frame() {
      if (!heroVisible || document.hidden) {
        running = false;
        return;
      }
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.x !== null) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < mouse.radius && md > 0) {
            p.x += (mdx / md) * 1.1;
            p.y += (mdy / md) * 1.1;
            ctx.beginPath();
            ctx.strokeStyle = "rgba(" + palette.a + "," + ((1 - md / mouse.radius) * 0.5).toFixed(3) + ")";
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const color = "rgba(" + (p.alt ? palette.b : palette.a) + ",0.8)";
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDistance) {
            ctx.beginPath();
            ctx.strokeStyle = "rgba(" + palette.link + "," + ((1 - d / linkDistance) * 0.22).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) start();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) start();
    });

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();
    start();
  }
})();
