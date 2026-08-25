import "./styles.css";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.classList.remove("no-js");
document.documentElement.classList.toggle("reduced-motion", reducedMotion.matches);
reducedMotion.addEventListener("change", () => {
  document.documentElement.classList.toggle("reduced-motion", reducedMotion.matches);
});

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

const header = document.querySelector<HTMLElement>("[data-header]");
const navToggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
const nav = document.querySelector<HTMLElement>("[data-nav]");

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

function setNavOpen(open: boolean) {
  if (!navToggle || !nav) return;
  navToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);
}

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") !== "true";
  setNavOpen(open);
  if (open) {
    nav?.querySelector<HTMLAnchorElement>("a")?.focus();
  }
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavOpen(false);
});

document.addEventListener("click", (event) => {
  if (!nav?.classList.contains("is-open")) return;
  const target = event.target as Node | null;
  if (target && !nav.contains(target) && !navToggle?.contains(target)) {
    setNavOpen(false);
  }
});

/* -------------------------------------------------------------------------- */
/* Reveals                                                                    */
/* -------------------------------------------------------------------------- */

function initReveals() {
  const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (reducedMotion.matches) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node) => observer.observe(node));
}

initReveals();

/* -------------------------------------------------------------------------- */
/* Testimonial carousel                                                       */
/* -------------------------------------------------------------------------- */

function initCarousel(root: HTMLElement) {
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
  const prev = root.querySelector<HTMLButtonElement>("[data-prev]");
  const next = root.querySelector<HTMLButtonElement>("[data-next]");
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-dot]"));
  const live = root.querySelector<HTMLElement>("[data-live]");
  const viewport = root.querySelector<HTMLElement>("[data-viewport]");
  if (!slides.length || !prev || !next || !viewport) return;

  let index = 0;
  let timer: number | null = null;
  let paused = false;

  const prefersReduced = () =>
    document.documentElement.classList.contains("reduced-motion");

  function announce(manual: boolean) {
    if (!live || !manual) return;
    const current = slides[index];
    const name = current?.dataset.author ?? `Testimonial ${index + 1}`;
    live.textContent = `Showing reflection from ${name}`;
  }

  function goTo(nextIndex: number, manual = false) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.tabIndex = active ? 0 : -1;
    });
    dots.forEach((dot, i) => {
      const selected = i === index;
      if (selected) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
      dot.classList.toggle("is-active", selected);
    });
    announce(manual);
    if (manual) restart();
  }

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (paused || prefersReduced() || document.hidden) return;
    timer = window.setInterval(() => goTo(index + 1), 8000);
  }

  function restart() {
    if (!paused && !prefersReduced()) start();
  }

  prev.addEventListener("click", () => goTo(index - 1, true));
  next.addEventListener("click", () => goTo(index + 1, true));

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goTo(i, true));
  });

  viewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1, true);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1, true);
    }
  });

  const pause = () => {
    paused = true;
    stop();
  };
  const resume = () => {
    paused = false;
    start();
  };

  root.addEventListener("mouseenter", pause);
  root.addEventListener("mouseleave", resume);
  root.addEventListener("focusin", pause);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget as Node | null)) resume();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else restart();
  });

  reducedMotion.addEventListener("change", () => {
    if (prefersReduced()) stop();
    else restart();
  });

  goTo(0);
  start();
}

const carousel = document.querySelector<HTMLElement>("[data-carousel]");
if (carousel) initCarousel(carousel);
