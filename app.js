function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function setText(id, value) {
  if (!value) return;
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function waLink(number, message) {
  const clean = (number || "").replace(/[^0-9]/g, "");
  return "https://wa.me/" + clean + "?text=" + encodeURIComponent(message);
}

let WHATSAPP_NUMBER = "923118146639";

fetch("content/settings.json")
  .then((res) => res.json())
  .then((settings) => {
    WHATSAPP_NUMBER = settings.whatsapp_number || WHATSAPP_NUMBER;

    setText("brand-name", settings.shop_name);
    document.title = (settings.shop_name || "Boutique") + " — Pre-Loved Ladies Clothing";
    setText("hero-heading", settings.hero_heading);
    setText("hero-copy", settings.hero_copy);
    setText("about-heading", settings.about_heading);
    setText("about-copy", settings.about_copy);
    setText("contact-heading", settings.contact_heading);
    setText("contact-copy", settings.contact_copy);
    setText("footer-note", settings.footer_note);

    const generalMsg = "Hi " + (settings.shop_name || "") + "! I'd like to know more about your available pieces.";
    const navBtn = document.getElementById("nav-wa-btn");
    const contactBtn = document.getElementById("contact-wa-btn");
    if (navBtn) navBtn.href = waLink(WHATSAPP_NUMBER, generalMsg);
    if (contactBtn) contactBtn.href = waLink(WHATSAPP_NUMBER, generalMsg);
  })
  .catch((err) => console.error("Could not load settings:", err));

function getSlides(p) {
  const slides = [];
  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : [];
  images.forEach((url) => slides.push({ type: "image", url }));
  if (p.video) slides.push({ type: "video", url: p.video });
  return slides;
}

function renderSlide(slide, title) {
  if (slide.type === "video") {
    return `<video class="slide" controls playsinline preload="metadata" src="${escapeHtml(slide.url)}"></video>`;
  }
  return `<img class="slide" src="${escapeHtml(slide.url)}" alt="${escapeHtml(title)}" loading="lazy" />`;
}

function renderProduct(p, index) {
  const num = String(index + 1).padStart(3, "0");
  const orderMsg =
    "Hi! I'm interested in: " + p.title + " (Size: " + p.size + ", PKR " + p.price + "). Is it still available?";
  const link = waLink(WHATSAPP_NUMBER, orderMsg);
  const slides = getSlides(p);
  const cardId = "card-" + index;

  const slidesHtml = slides
    .map((slide, i) => renderSlide(slide, p.title).replace('class="slide"', `class="slide${i === 0 ? " active" : ""}"`))
    .join("");

  const dots =
    slides.length > 1
      ? `<div class="gallery-dots">${slides
          .map(
            (s, i) =>
              `<button type="button" class="${i === 0 ? "active" : ""}" data-card="${cardId}" data-idx="${i}" aria-label="${s.type === "video" ? "Video" : "Photo " + (i + 1)}">${s.type === "video" ? "▶" : ""}</button>`
          )
          .join("")}</div>`
      : "";

  return `
    <article class="tag-card" id="${cardId}">
      <div class="tag-hole"></div>
      <div class="tag-photo">
        ${slidesHtml}
        ${dots}
      </div>
      <div class="tag-body">
        <span class="tag-num">No. ${num}${p.category ? " · " + escapeHtml(p.category) : ""}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="tag-meta">
          <span class="chip">Size ${escapeHtml(p.size)}</span>
          <span class="chip condition">${escapeHtml(p.condition)}</span>
        </div>
        <p class="tag-desc">${escapeHtml(p.description)}</p>
        <div class="tag-footer">
          <div class="tag-price">PKR ${escapeHtml(p.price)}<span>fixed price</span></div>
          <a class="wa-btn" href="${link}" target="_blank" rel="noopener">Order</a>
        </div>
      </div>
    </article>
  `;
}

function wireGalleryDots(container) {
  container.querySelectorAll(".gallery-dots button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = document.getElementById(btn.dataset.card);
      if (!card) return;
      const idx = Number(btn.dataset.idx);
      const slideEls = card.querySelectorAll(".tag-photo .slide");
      slideEls.forEach((el, i) => {
        el.classList.toggle("active", i === idx);
        if (el.tagName === "VIDEO" && i !== idx) el.pause();
      });
      card.querySelectorAll(".gallery-dots button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

let ALL_PRODUCTS = [];
let ACTIVE_CATEGORY = "All";
let SEARCH_TERM = "";

function applyFiltersAndRender() {
  const grid = document.getElementById("shop-grid");
  const emptyMsg = document.getElementById("shop-empty");
  if (!grid) return;

  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesCategory = ACTIVE_CATEGORY === "All" || p.category === ACTIVE_CATEGORY;
    const matchesSearch = !SEARCH_TERM || (p.title || "").toLowerCase().includes(SEARCH_TERM);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }
  if (emptyMsg) emptyMsg.hidden = true;
  grid.innerHTML = filtered.map(renderProduct).join("");
  wireGalleryDots(grid);
}

function renderCategoryFilters() {
  const wrap = document.getElementById("category-filters");
  if (!wrap) return;
  const categories = ["All", ...new Set(ALL_PRODUCTS.map((p) => p.category).filter(Boolean))];
  wrap.innerHTML = categories
    .map(
      (cat) =>
        `<button type="button" class="cat-chip${cat === ACTIVE_CATEGORY ? " active" : ""}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
    )
    .join("");
  wrap.querySelectorAll(".cat-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      ACTIVE_CATEGORY = btn.dataset.cat;
      wrap.querySelectorAll(".cat-chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFiltersAndRender();
    });
  });
}

const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    SEARCH_TERM = e.target.value.trim().toLowerCase();
    applyFiltersAndRender();
  });
}

fetch("content/products.json")
  .then((res) => res.json())
  .then((data) => {
    ALL_PRODUCTS = data.products || [];
    renderCategoryFilters();
    applyFiltersAndRender();
  })
  .catch((err) => console.error("Could not load products:", err));
