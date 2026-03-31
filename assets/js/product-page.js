const PRODUCT_PAGE_CONFIG = window.KAPTAINBITES_CONFIG || {};
const PRODUCT_PAGE_WHATSAPP = PRODUCT_PAGE_CONFIG.whatsappNumber || "917760172150";
const productCartApi = window.KAPTAINBITES_CART || null;
const PRODUCT_PATHS = window.KAPTAINBITES_PATHS || {};
const PRODUCT_LISTING_URL = PRODUCT_PATHS.shopUrl || "../shop.html";

function resolveProductPagePath(path = "") {
  if (!path || /^(?:[a-z]+:|\/\/|#)/i.test(path)) {
    return path;
  }

  return path.startsWith("../") ? path : `../${path}`;
}

function setupProductMobileNavigation() {
  const toggle = document.querySelector(".mobile-toggle");
  const links = document.querySelector(".nav-links");

  if (!toggle || !links) {
    return;
  }

  function closeNav() {
    links.classList.remove("mobile-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("mobile-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (toggle.contains(event.target) || links.contains(event.target)) {
      return;
    }

    closeNav();
  });
}

function getProductCatalog() {
  return Array.isArray(window.KAPTAINBITES_PRODUCTS) ? window.KAPTAINBITES_PRODUCTS : [];
}

function getProductById(productId) {
  return getProductCatalog().find((item) => item.id === productId);
}

function normalizeProductSearchQuery(query = "") {
  return query.trim().toLowerCase();
}

function getFilteredProductCatalog(query = "") {
  const normalizedQuery = normalizeProductSearchQuery(query);

  if (!normalizedQuery) {
    return getProductCatalog();
  }

  return getProductCatalog().filter((product) => {
    const searchableText = [
      product.line,
      product.name,
      product.description,
      product.weight,
      product.notes.join(" "),
      product.searchTerms.join(" ")
    ].join(" ").toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

function buildProductSearchKeywords(query, matches) {
  const normalizedQuery = normalizeProductSearchQuery(query);
  const keywordPool = new Set();

  matches.forEach((product) => {
    product.searchTerms.forEach((term) => keywordPool.add(term));
  });

  getProductCatalog().forEach((product) => {
    product.searchTerms.forEach((term) => keywordPool.add(term));
  });

  return Array.from(keywordPool).filter((term) => {
    if (!normalizedQuery) {
      return true;
    }

    return term.includes(normalizedQuery) || normalizedQuery.includes(term);
  }).slice(0, 6);
}

function buildProductSearchResult(product) {
  return `
    <button type="button" class="search-result" data-product-id="${product.id}">
      <img src="${resolveProductPagePath(product.thumb || product.image)}" class="search-result__image" alt="${product.alt}" loading="lazy" decoding="async" width="520" height="520">
      <span class="search-result__copy">
        <span class="search-result__name">${product.name}</span>
        <span class="search-result__meta">${product.weight} | Rs.${product.price}</span>
      </span>
    </button>
  `;
}

function setupProductSearch() {
  const searchForm = document.querySelector(".site-search");
  const searchInput = document.getElementById("product-search");
  const searchClear = document.querySelector(".site-search__clear");
  const searchDropdown = document.getElementById("search-dropdown");
  const searchKeywords = document.getElementById("search-keywords");
  const suggestionsList = document.getElementById("search-suggestions-list");
  const searchViewAll = document.getElementById("search-view-all");

  if (!searchForm || !searchInput || !searchClear || !searchDropdown || !searchKeywords || !suggestionsList || !searchViewAll) {
    return;
  }

  function updateClearButton() {
    searchClear.hidden = searchInput.value.trim().length === 0;
  }

  function hideSuggestions() {
    searchDropdown.hidden = true;
    searchKeywords.innerHTML = "";
    suggestionsList.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
  }

  function viewAllResults(query) {
    const normalizedQuery = normalizeProductSearchQuery(query);
    const targetUrl = normalizedQuery
      ? `${PRODUCT_LISTING_URL}?q=${encodeURIComponent(normalizedQuery)}`
      : PRODUCT_LISTING_URL;
    window.location.href = targetUrl;
  }

  function renderSuggestions(query) {
    const normalizedQuery = normalizeProductSearchQuery(query);
    updateClearButton();

    if (!normalizedQuery) {
      hideSuggestions();
      return;
    }

    const matches = getFilteredProductCatalog(normalizedQuery).slice(0, 4);
    const keywords = buildProductSearchKeywords(normalizedQuery, matches);

    searchKeywords.innerHTML = keywords.length
      ? keywords.map((keyword) => `<button type="button" class="search-chip" data-keyword="${keyword}">${keyword}</button>`).join("")
      : `<p class="site-search__empty">No suggestions yet.</p>`;

    suggestionsList.innerHTML = matches.length
      ? matches.map(buildProductSearchResult).join("")
      : `<p class="site-search__empty">No matching snacks found.</p>`;

    searchDropdown.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  searchInput.addEventListener("input", () => {
    renderSuggestions(searchInput.value);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderSuggestions(searchInput.value);
    }
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    viewAllResults(searchInput.value);
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    updateClearButton();
    hideSuggestions();
    searchInput.focus();
  });

  searchKeywords.addEventListener("click", (event) => {
    const keywordButton = event.target.closest("[data-keyword]");
    if (!keywordButton) {
      return;
    }

    searchInput.value = keywordButton.dataset.keyword;
    renderSuggestions(searchInput.value);
  });

  suggestionsList.addEventListener("click", (event) => {
    const result = event.target.closest("[data-product-id]");
    if (!result) {
      return;
    }

    const product = getProductById(result.dataset.productId);
    if (product) {
      window.location.href = resolveProductPagePath(product.pageUrl);
    }
  });

  searchViewAll.addEventListener("click", () => {
    viewAllResults(searchInput.value);
  });

  document.addEventListener("click", (event) => {
    if (searchForm.contains(event.target) || searchDropdown.contains(event.target)) {
      return;
    }

    hideSuggestions();
  });

  updateClearButton();
}

function buildProductOrderMessage(product, quantity) {
  const total = product.price * quantity;

  return `Hi, I want to order:\n\nProduct: ${product.name}\nPack Size: ${product.weight}\nQuantity: ${quantity}\nPrice per pack: Rs.${product.price}\nTotal: Rs.${total}\n\nPlease share payment details.`;
}

function openProductWhatsApp(message) {
  const url = `https://wa.me/${PRODUCT_PAGE_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function flashProductButton(button, label) {
  if (!button) {
    return;
  }

  const originalLabel = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = originalLabel;
  button.textContent = label;
  button.disabled = true;

  window.setTimeout(() => {
    button.textContent = originalLabel;
    button.disabled = false;
  }, 1200);
}

function buildRelatedProductCard(product) {
  return `
    <a class="related-product-card" href="${resolveProductPagePath(product.pageUrl)}">
      <span class="related-product-card__media">
        <img src="${resolveProductPagePath(product.thumb || product.image)}" alt="${product.alt}" loading="lazy" decoding="async" width="520" height="520">
      </span>
      <span class="related-product-card__copy">
        <span class="related-product-card__eyebrow">${product.line}</span>
        <span class="related-product-card__title">${product.name}</span>
        <span class="related-product-card__price">Rs.${product.price} <span>/ pack</span></span>
      </span>
    </a>
  `;
}

function renderProductDetail() {
  const productId = document.body.dataset.productId;
  const catalog = getProductCatalog();
  const product = catalog.find((item) => item.id === productId);
  const container = document.getElementById("product-detail");

  if (!container) {
    return;
  }

  if (!product) {
    container.innerHTML = `
      <article class="product-detail-card fade-in visible">
        <div class="product-detail__content">
          <span class="tag">Unavailable</span>
          <h1>Product not found</h1>
          <p>The snack you are looking for could not be loaded.</p>
          <a class="btn-secondary" href="${PRODUCT_LISTING_URL}">Back to Shop</a>
        </div>
      </article>
    `;
    return;
  }

  document.title = `${product.name} | KaptainBites`;
  const relatedProducts = catalog.filter((item) => item.id !== product.id).slice(0, 3);

  container.innerHTML = `
    <article class="product-detail-card product-detail-card--${product.theme} fade-in visible">
      <div class="product-detail__media">
        <img src="${resolveProductPagePath(product.image)}" alt="${product.alt}" decoding="async" fetchpriority="high" width="880" height="880">
      </div>
      <div class="product-detail__content">
        <p class="product-detail__line">${product.line}</p>
        <h1>${product.name}</h1>
        <div class="product-detail__meta">
          <span>${product.weight}</span>
          <span>No Preservatives</span>
          <span>Premium Roasted Nuts</span>
        </div>
        <div class="product-detail__price">
          <strong>Rs.${product.price}</strong>
          <span>/ pack</span>
          ${product.originalPrice ? `<s>Rs.${product.originalPrice}</s>` : ""}
        </div>
        <p class="product-detail__description">${product.description}</p>
        <ul class="product-detail__notes">
          ${product.notes.map((note) => `<li>${note}</li>`).join("")}
        </ul>
        <div class="product-detail__order">
          <div class="quantity-control quantity-control--detail" aria-label="Select quantity for ${product.name}">
            <button type="button" class="qty-btn" data-action="decrease">-</button>
            <span class="qty-value" data-qty>1</span>
            <button type="button" class="qty-btn" data-action="increase">+</button>
          </div>
          <div class="product-detail__order-actions">
            <button type="button" class="btn-secondary" data-product-cart>Add to Cart</button>
            <button type="button" class="btn-primary" data-product-order>Order on WhatsApp</button>
          </div>
        </div>
        <a class="product-detail__back" href="${PRODUCT_LISTING_URL}">Back to Shop</a>
      </div>
    </article>
    ${relatedProducts.length ? `
      <section class="related-products fade-in visible">
        <div class="section-header product-detail-section-header">
          <span class="tag">More Flavors</span>
          <h2>Explore More Snacks</h2>
        </div>
        <div class="related-products__grid">
          ${relatedProducts.map(buildRelatedProductCard).join("")}
        </div>
      </section>
    ` : ""}
  `;

  let quantity = 1;
  const quantityNode = container.querySelector("[data-qty]");
  const orderButton = container.querySelector("[data-product-order]");
  const cartButton = container.querySelector("[data-product-cart]");

  container.addEventListener("click", (event) => {
    const quantityButton = event.target.closest(".qty-btn");
    if (!quantityButton) {
      return;
    }

    if (quantityButton.dataset.action === "increase") {
      quantity += 1;
    }

    if (quantityButton.dataset.action === "decrease" && quantity > 1) {
      quantity -= 1;
    }

    if (quantityNode) {
      quantityNode.textContent = String(quantity);
    }
  });

  orderButton?.addEventListener("click", () => {
    openProductWhatsApp(buildProductOrderMessage(product, quantity));
  });

  cartButton?.addEventListener("click", () => {
    if (!productCartApi) {
      return;
    }

    productCartApi.addCartItem(product.id, quantity);
    flashProductButton(cartButton, "Added");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupProductMobileNavigation();
  setupProductSearch();
  renderProductDetail();
});







