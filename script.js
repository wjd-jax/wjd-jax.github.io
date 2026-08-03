(() => {
  const profile = window.SITE_PROFILE || {};

  document.querySelectorAll("[data-profile]").forEach((node) => {
    const key = node.dataset.profile;
    if (profile[key]) node.textContent = profile[key];
  });
  const copyText = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        // Continue with the selection fallback for file:// and restricted browsers.
      }
    }
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.inset = "0 auto auto -9999px";
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, value.length);
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  };
  document.querySelectorAll("[data-email-copy]").forEach((node) => {
    if (!profile.email) {
      node.hidden = true;
      return;
    }
    const label = node.querySelector("[data-email-copy-label]");
    const status = document.querySelector("[data-email-copy-status]");
    const defaultLabel = label?.textContent?.trim() || profile.emailLabel || "Email";
    let resetTimer = 0;
    node.title = `点击复制：${profile.email}`;
    node.setAttribute("aria-label", `复制邮箱 ${profile.email}`);
    node.addEventListener("click", async (event) => {
      event.preventDefault();
      window.clearTimeout(resetTimer);
      let copied = false;
      try { copied = await copyText(profile.email); } catch (error) { copied = false; }
      if (label) label.textContent = copied ? "已复制" : "复制失败";
      node.classList.toggle("is-copied", copied);
      node.setAttribute("aria-label", copied ? `已复制邮箱 ${profile.email}` : `复制失败，邮箱为 ${profile.email}`);
      if (status) status.textContent = copied ? `邮箱 ${profile.email} 已复制` : `复制失败，邮箱是 ${profile.email}`;
      node.focus({ preventScroll: true });
      resetTimer = window.setTimeout(() => {
        if (label) label.textContent = defaultLabel;
        node.classList.remove("is-copied");
        node.setAttribute("aria-label", `复制邮箱 ${profile.email}`);
        if (status) status.textContent = "";
      }, 1800);
    });
  });
  document.querySelectorAll('[data-profile-link="social"]').forEach((node) => {
    if (!profile.socialUrl) return;
    node.href = profile.socialUrl;
    node.hidden = false;
  });
  document.querySelectorAll("[data-profile-image]").forEach((node) => {
    if (profile.avatarUrl) node.src = profile.avatarUrl;
  });
  document.querySelectorAll('[data-profile-link="github"]').forEach((node) => {
    if (!profile.githubUrl) return;
    node.href = profile.githubUrl;
    if (profile.githubHandle) {
      node.title = `github.com/${profile.githubHandle}`;
      node.setAttribute("aria-label", `访问 GitHub：${profile.githubHandle}`);
    }
    node.hidden = false;
  });
  document.querySelectorAll('[data-profile-link="x"]').forEach((node) => {
    if (!profile.xUrl) return;
    node.href = profile.xUrl;
    if (profile.xHandle) {
      node.title = profile.xHandle;
      node.setAttribute("aria-label", `访问 X：${profile.xHandle}`);
    }
    node.hidden = false;
  });
  document.querySelectorAll('[data-profile-link="telegram"]').forEach((node) => {
    if (!profile.telegramUrl) return;
    node.href = profile.telegramUrl;
    if (profile.telegramHandle) {
      node.title = profile.telegramHandle;
      node.setAttribute("aria-label", `通过 Telegram 联系：${profile.telegramHandle}`);
    }
    node.hidden = false;
  });
  document.querySelectorAll("[data-wechat-open]").forEach((node) => {
    if (!profile.wechatQrUrl) return;
    if (profile.wechatHandle) node.title = `微信：${profile.wechatHandle}`;
    node.hidden = false;
  });
  document.querySelectorAll("[data-wechat-qr]").forEach((node) => {
    if (profile.wechatQrUrl) node.src = profile.wechatQrUrl;
  });

  const currentYear = document.querySelector("#currentYear");
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const hero = document.querySelector(".hero");
  const systemWindow = document.querySelector(".system-window");
  const root = document.documentElement;
  const bootScreen = document.querySelector(".boot-screen");
  const bootPercent = document.querySelector(".boot-percent");
  const bootSkip = document.querySelector(".boot-skip");
  const motionToggle = document.querySelector("[data-motion-toggle]");

  const syncMotionToggle = () => {
    if (!motionToggle) return;
    const disabled = root.classList.contains("motion-off");
    motionToggle.setAttribute("aria-pressed", String(disabled));
    motionToggle.setAttribute("aria-label", disabled ? "开启页面动效" : "关闭页面动效");
    motionToggle.querySelector("span").textContent = disabled ? "○" : "◉";
  };
  syncMotionToggle();
  motionToggle?.addEventListener("click", () => {
    const disabled = !root.classList.contains("motion-off");
    root.classList.toggle("motion-off", disabled);
    root.classList.add("experience-ready");
    try { localStorage.setItem("jax-motion", disabled ? "off" : "on"); } catch (error) {}
    syncMotionToggle();
    document.dispatchEvent(new CustomEvent("motion-preference-changed", { detail: { disabled } }));
  });

  const completeBoot = () => {
    if (bootPercent) bootPercent.textContent = "100";
    root.classList.add("experience-ready");
    try { sessionStorage.setItem("jax-experience-ready", "1"); } catch (error) {}
    window.setTimeout(() => bootScreen?.setAttribute("aria-hidden", "true"), 360);
  };

  if (reducedMotion.matches || root.classList.contains("experience-ready") || root.classList.contains("motion-off")) {
    completeBoot();
  } else {
    const bootStarted = performance.now();
    const updateBoot = (time) => {
      const progress = Math.min(1, (time - bootStarted) / 520);
      if (bootPercent) bootPercent.textContent = String(Math.round(progress * 100)).padStart(2, "0");
      if (progress < 1) requestAnimationFrame(updateBoot);
      else completeBoot();
    };
    requestAnimationFrame(updateBoot);
    bootSkip?.addEventListener("click", completeBoot);
  }

  const canvas = document.querySelector("#neuralCanvas");
  if (canvas && !reducedMotion.matches) {
    const context = canvas.getContext("2d");
    const pointer = { x: -1000, y: -1000 };
    let nodes = [];
    let canvasFrame = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let pixelRatio = 1;
    let motionStep = 1;
    let motionFrame = 0;
    let heroVisible = true;
    let canvasRunning = !root.classList.contains("motion-off") && window.innerWidth >= 600;

    const createNodes = () => {
      const count = window.innerWidth < 700 ? 20 : Math.min(54, Math.round(window.innerWidth / 38));
      nodes = Array.from({ length: count }, (_, index) => ({
        x: (index * 193.7) % canvasWidth,
        y: (index * 97.3) % canvasHeight,
        vx: ((index % 5) - 2) * 0.035,
        vy: (((index * 3) % 7) - 3) * 0.025,
        size: index % 7 === 0 ? 1.35 : 0.75
      }));
    };

    const resizeCanvas = () => {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvasWidth * pixelRatio);
      canvas.height = Math.round(canvasHeight * pixelRatio);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createNodes();
    };

    const drawNetwork = () => {
      if (!canvasRunning) return;
      motionFrame = (motionFrame + 1) % motionStep;
      if (motionFrame !== 0) {
        canvasFrame = requestAnimationFrame(drawNetwork);
        return;
      }
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      nodes.forEach((node, index) => {
        node.x = (node.x + node.vx + canvasWidth) % canvasWidth;
        node.y = (node.y + node.vy + canvasHeight) % canvasHeight;
        const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        const glow = Math.max(0, 1 - pointerDistance / 240);
        context.beginPath();
        context.arc(node.x, node.y, node.size + glow * 1.3, 0, Math.PI * 2);
        context.fillStyle = `rgba(133,151,255,${0.16 + glow * 0.48})`;
        context.fill();
        for (let next = index + 1; next < nodes.length; next += 1) {
          const other = nodes[next];
          const distance = Math.hypot(node.x - other.x, node.y - other.y);
          if (distance > 150) continue;
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(105,145,255,${(1 - distance / 150) * 0.075})`;
          context.lineWidth = 0.6;
          context.stroke();
        }
      });
      canvasFrame = requestAnimationFrame(drawNetwork);
    };

    const syncCanvasPlayback = () => {
      canvasRunning = heroVisible && !document.hidden && !root.classList.contains("motion-off") && window.innerWidth >= 600;
      cancelAnimationFrame(canvasFrame);
      if (canvasRunning) drawNetwork();
      else context.clearRect(0, 0, canvasWidth, canvasHeight);
    };

    resizeCanvas();
    syncCanvasPlayback();
    window.addEventListener("resize", () => {
      resizeCanvas();
      syncCanvasPlayback();
    }, { passive: true });
    document.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }, { passive: true });
    document.addEventListener("visibilitychange", syncCanvasPlayback);
    document.addEventListener("motion-preference-changed", syncCanvasPlayback);
    if (hero && "IntersectionObserver" in window) {
      const canvasObserver = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        syncCanvasPlayback();
      }, { threshold: 0.02 });
      canvasObserver.observe(hero);
    }
  }

  if (!reducedMotion.matches && finePointer.matches) {
    let pointerFrame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight * 0.28;
    document.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (root.classList.contains("motion-off") || pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        root.style.setProperty("--pointer-x", `${pointerX}px`);
        root.style.setProperty("--pointer-y", `${pointerY}px`);
        pointerFrame = 0;
      });
    }, { passive: true });

    const reactiveGlass = document.querySelectorAll([
      ".nav-shell",
      ".hero-eyebrow",
      ".system-window",
      ".identity-evidence",
      ".bento-card",
      ".career-ledger",
      ".case-console",
      ".principle-grid article",
      ".now-list",
      ".contact-orbit"
    ].join(","));
    reactiveGlass.forEach((surface) => {
      let glassFrame = 0;
      let glassBounds = null;
      let glassX = 50;
      let glassY = 10;
      surface.addEventListener("pointerenter", () => {
        glassBounds = surface.getBoundingClientRect();
      }, { passive: true });
      surface.addEventListener("pointermove", (event) => {
        if (root.classList.contains("motion-off")) return;
        const bounds = glassBounds || surface.getBoundingClientRect();
        glassX = ((event.clientX - bounds.left) / bounds.width) * 100;
        glassY = ((event.clientY - bounds.top) / bounds.height) * 100;
        if (glassFrame) return;
        glassFrame = requestAnimationFrame(() => {
          surface.style.setProperty("--glass-x", `${Math.max(0, Math.min(100, glassX)).toFixed(1)}%`);
          surface.style.setProperty("--glass-y", `${Math.max(0, Math.min(100, glassY)).toFixed(1)}%`);
          glassFrame = 0;
        });
      }, { passive: true });
      surface.addEventListener("pointerleave", () => {
        glassBounds = null;
      }, { passive: true });
    });

    if (hero && systemWindow) {
      let tiltFrame = 0;
      let tiltBounds = null;
      let tiltX = 0;
      let tiltY = 0;
      systemWindow.addEventListener("pointerenter", () => {
        tiltBounds = systemWindow.getBoundingClientRect();
      }, { passive: true });
      systemWindow.addEventListener("pointermove", (event) => {
        if (root.classList.contains("motion-off")) return;
        const bounds = tiltBounds || systemWindow.getBoundingClientRect();
        const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
        const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
        tiltX = -y * 1.4;
        tiltY = x * 1.8;
        if (tiltFrame) return;
        tiltFrame = requestAnimationFrame(() => {
          systemWindow.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
          systemWindow.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
          tiltFrame = 0;
        });
      }, { passive: true });
      systemWindow.addEventListener("pointerleave", () => {
        if (tiltFrame) cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
        tiltBounds = null;
        systemWindow.style.setProperty("--tilt-x", "0deg");
        systemWindow.style.setProperty("--tilt-y", "0deg");
      });
    }
  }

  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector("#siteNav");
  if (menuButton && navigation) {
    const closeMenu = (restoreFocus = false) => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "打开导航");
      navigation.classList.remove("open");
      if (restoreFocus) menuButton.focus({ preventScroll: true });
    };
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest?.(".menu-button");
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        const opening = menuButton.getAttribute("aria-expanded") !== "true";
        menuButton.setAttribute("aria-expanded", String(opening));
        menuButton.setAttribute("aria-label", opening ? "关闭导航" : "打开导航");
        navigation.classList.toggle("open", opening);
        if (opening) requestAnimationFrame(() => navigation.querySelector("a")?.focus({ preventScroll: true }));
        return;
      }
      if (menuButton.getAttribute("aria-expanded") === "true" && !navigation.contains(event.target)) closeMenu();
    }, true);
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
  }

  const tabs = [...document.querySelectorAll("[data-case-tab]")];
  const panels = [...document.querySelectorAll("[data-case-panel]")];
  const activateCase = (key, focus = false) => {
    tabs.forEach((tab) => {
      const selected = tab.dataset.caseTab === key;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
      if (selected && tab.parentElement.scrollWidth > tab.parentElement.clientWidth) {
        requestAnimationFrame(() => {
          const targetLeft = tab.offsetLeft - (tab.parentElement.clientWidth - tab.offsetWidth) / 2;
          tab.parentElement.scrollTo({ left: Math.max(0, targetLeft), behavior: focus ? "smooth" : "auto" });
        });
      }
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.casePanel !== key;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateCase(tab.dataset.caseTab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      activateCase(tabs[next].dataset.caseTab, true);
    });
  });
  const initialCase = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  if (initialCase) activateCase(initialCase.dataset.caseTab);

  const wechatDialog = document.querySelector(".wechat-dialog");
  const wechatOpeners = document.querySelectorAll("[data-wechat-open]");
  const wechatClose = document.querySelector("[data-wechat-close]");
  if (wechatDialog) {
    wechatOpeners.forEach((button) => button.addEventListener("click", () => {
      if (typeof wechatDialog.showModal === "function") wechatDialog.showModal();
      else wechatDialog.setAttribute("open", "");
    }));
    wechatClose?.addEventListener("click", () => wechatDialog.close());
    wechatDialog.addEventListener("click", (event) => {
      if (event.target === wechatDialog) wechatDialog.close();
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -32px" });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const globalHeader = document.querySelector(".global-header");
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const updateNavigation = () => {
    globalHeader?.classList.toggle("is-scrolled", window.scrollY > 18);
    let activeId = "";
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 180) activeId = section.id;
    });
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    document.querySelectorAll("[data-rail-section]").forEach((item) => {
      const sectionId = activeId || "top";
      item.classList.toggle("active", item.dataset.railSection === sectionId);
    });
    const progress = document.querySelector("[data-scroll-progress]");
    if (progress) {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleY(${available > 0 ? Math.min(1, window.scrollY / available) : 0})`;
    }
  };
  updateNavigation();
  window.addEventListener("scroll", updateNavigation, { passive: true });
})();
