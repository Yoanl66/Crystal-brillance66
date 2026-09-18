(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Année automatique dans le footer.
  $("#year").textContent = new Date().getFullYear();

  // Menu mobile accessible.
  const toggle = $(".nav-toggle");
  const panel = $("#main-menu");

  const closeMenu = () => {
    if (!toggle || !panel) return;
    toggle.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
  };

  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.classList.toggle("is-open", !expanded);
  });

  $$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));

  document.addEventListener("click", event => {
    if (!panel?.classList.contains("is-open")) return;
    if (!panel.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });

  // Navigation : lien actif selon la section visible.
  const sections = $$("main section[id]");
  const navLinks = $$(".nav-link");

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${entry.target.id}`
      ));
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  sections.forEach(section => sectionObserver.observe(section));

  // Apparitions légères, sans bibliothèque externe.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  $$(".reveal").forEach(element => revealObserver.observe(element));

  // Avis : compatible avec plusieurs formats courants de avis.json.
  const reviewsList = $("#reviewsList");
  const rating = $("#rating");
  const totalReviews = $("#totalReviews");
  const stars = $("#averageStars");
  const dots = $("#reviewDots");

  let reviews = [];
  let currentPage = 0;
  let perPage = 3;

  const escapeHTML = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const getReviewName = review =>
    review.name ?? review.author ?? review.auteur ?? review.user ?? "Client";

  const getReviewText = review =>
    review.text ?? review.comment ?? review.commentaire ?? review.review ?? review.avis ?? "";

  const getReviewRating = review =>
    Number(review.rating ?? review.note ?? review.stars ?? 5) || 5;

  const getReviewDate = review =>
    review.date ?? review.publishedAt ?? review.published_at ?? "";

  function normalizeReviews(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.reviews)) return data.reviews;
    if (Array.isArray(data?.avis)) return data.avis;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  function starString(value) {
    const rounded = Math.max(0, Math.min(5, Math.round(value)));
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }).format(date);
  }

  function calculatePerPage() {
    if (window.innerWidth <= 760) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
  }

  function renderReviews() {
    if (!reviewsList) return;

    perPage = calculatePerPage();
    const pages = Math.max(1, Math.ceil(reviews.length / perPage));
    currentPage = Math.min(currentPage, pages - 1);

    const start = currentPage * perPage;
    const visible = reviews.slice(start, start + perPage);

    reviewsList.innerHTML = visible.map(review => {
      const name = escapeHTML(getReviewName(review));
      const text = escapeHTML(getReviewText(review));
      const score = getReviewRating(review);
      const date = escapeHTML(formatDate(getReviewDate(review)));

      return `
        <article class="review-card">
          <div class="review-stars" aria-label="Note ${score} sur 5">${starString(score)}</div>
          <p class="review-text">“${text}”</p>
          <div class="review-author">${name}</div>
          ${date ? `<span class="review-date">${date}</span>` : ""}
        </article>
      `;
    }).join("");

    if (!visible.length) {
      reviewsList.innerHTML = `
        <article class="review-card">
          <p class="review-text">Les avis seront bientôt disponibles.</p>
        </article>
      `;
    }

    // Une page = déplacement nul : le responsive est géré par le nombre de cartes.
    reviewsList.style.transform = "translateX(0)";

    dots.innerHTML = Array.from({ length: pages }, (_, index) => `
      <button class="carousel-dot ${index === currentPage ? "active" : ""}"
              type="button"
              data-page="${index}"
              aria-label="Afficher les avis ${index + 1}"></button>
    `).join("");

    $$(".carousel-dot", dots).forEach(dot => {
      dot.addEventListener("click", () => {
        currentPage = Number(dot.dataset.page);
        renderReviews();
      });
    });
  }

  function updateRating() {
    if (!reviews.length) {
      rating.textContent = "—";
      totalReviews.textContent = "0";
      stars.textContent = "☆☆☆☆☆";
      return;
    }

    const scores = reviews.map(getReviewRating);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    rating.textContent = average.toFixed(1).replace(".", ",");
    totalReviews.textContent = String(reviews.length);
    stars.textContent = starString(average);
  }

  async function loadReviews() {
    try {
      const response = await fetch("avis.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      reviews = normalizeReviews(data);
      updateRating();
      renderReviews();
    } catch (error) {
      console.warn("Impossible de charger avis.json :", error);
      reviews = [];
      updateRating();
      renderReviews();
    }
  }

  $$(".carousel-btn").forEach(button => {
    button.addEventListener("click", () => {
      if (!reviews.length) return;
      const pages = Math.max(1, Math.ceil(reviews.length / calculatePerPage()));
      currentPage = (currentPage + Number(button.dataset.direction) + pages) % pages;
      renderReviews();
    });
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderReviews, 150);
  });

  loadReviews();
})();
