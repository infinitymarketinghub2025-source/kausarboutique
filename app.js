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

function renderProduct(p, index) {
  const num = String(index + 1).padStart(3, "0");
  const orderMsg =
    "Hi! I'm interested in: " + p.title + " (Size: " + p.size + ", PKR " + p.price + "). Is it still available?";
  const link = waLink(WHATSAPP_NUMBER, orderMsg);

  return `
    <article class="tag-card">
      <div class="tag-hole"></div>
      <div class="tag-photo">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy" />
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

fetch("content/products.json")
  .then((res) => res.json())
  .then((data) => {
    const products = data.products || [];
    const grid = document.getElementById("shop-grid");
    if (!grid) return;
    if (products.length === 0) {
      grid.innerHTML = '<p style="color:var(--muted);">No pieces listed right now — check back soon.</p>';
      return;
    }
    grid.innerHTML = products.map(renderProduct).join("");
  })
  .catch((err) => console.error("Could not load products:", err));
