function toggleMenu() {
  const navbar = document.querySelector(".navbar");
  const burger = document.querySelector(".burger");

  burger.addEventListener("click", (e) => {
    navbar.classList.toggle("show-nav");
  });
  // bonus
  const navbarLinks = document.querySelectorAll(".navbar a");
  navbarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      navbar.classList.toggle("show-nav");
    });
  });
}
toggleMenu();

document.addEventListener("DOMContentLoaded", function () {
  const home = document.getElementById("home");
  const wiper = document.querySelector(".wiper");
  if (home && wiper) {
    wiper.addEventListener("animationend", function () {
      home.classList.add("clean");
    });
  }
});

// Avis

/* ============================
   GÉNÉRATION DES ÉTOILES
============================ */
function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  let html = "";
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (half) html += '<i class="fas fa-star-half-alt"></i>';
  for (let i = 0; i < empty; i++) html += '<i class="far fa-star"></i>';

  return html;
}

/* ============================
   SCROLL UTILITAIRE
============================ */
function scrollByCards(container, cardsCount = 1) {
  const card = container.querySelector(".review-card");
  if (!card) return;

  const style = getComputedStyle(container);
  const gap = parseInt(style.columnGap || style.gap || 0, 10);

  const scrollValue = (card.offsetWidth + gap) * cardsCount;
  container.scrollBy({ left: scrollValue, behavior: "smooth" });
}

/* ============================
   BREAKPOINT
============================ */
function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/* ============================
   AUTOPLAY
============================ */
function setupAutoplay(container) {
  let interval = null;

  function start() {
    if (getDeviceType() !== "desktop") {
      stop();
      interval = setInterval(() => {
        scrollByCards(container, getDeviceType() === "tablet" ? 2 : 1);
      }, 3500);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  container.addEventListener("mouseenter", stop);
  container.addEventListener("mouseleave", start);
  window.addEventListener("resize", start);

  start();
}

/* ============================
   MAIN
============================ */
async function loadReviews() {
  const res = await fetch("avis.json");
  const reviews = await res.json();

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Résumé note
  document.getElementById("rating").textContent = avg.toFixed(1);
  document.getElementById("totalReviews").textContent = reviews.length;
  document.getElementById("averageStars").innerHTML = generateStars(avg);

  const container = document.getElementById("reviewsList");
  container.innerHTML = "";

  // Injecter 5 avis
  reviews.slice(0, 5).forEach((review) => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
            <div class="review-stars">${generateStars(review.rating)}</div>
            <strong>${review.author_name}</strong><br><br>
            ${review.text}
        `;
    container.appendChild(card);
  });

  // Boutons
  const leftBtn = document.querySelector(".carousel-btn.left");
  const rightBtn = document.querySelector(".carousel-btn.right");

  leftBtn.onclick = () => {
    const type = getDeviceType();
    if (type !== "desktop") {
      scrollByCards(container, type === "tablet" ? -2 : -1);
    }
  };

  rightBtn.onclick = () => {
    const type = getDeviceType();
    if (type !== "desktop") {
      scrollByCards(container, type === "tablet" ? 2 : 1);
    }
  };

  setupAutoplay(container);
}

loadReviews();
