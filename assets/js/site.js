const SITE_CONFIG = window.KAPTAINBITES_CONFIG || {};
const PRODUCT_CATALOG = Array.isArray(window.KAPTAINBITES_PRODUCTS) ? window.KAPTAINBITES_PRODUCTS : [];
const SITE_PATHS = window.KAPTAINBITES_PATHS || {};
const PRODUCTS_PAGE_URL = SITE_PATHS.shopUrl || "shop.html";
const WHATSAPP_NUMBER = SITE_CONFIG.whatsappNumber || "917760172150";
const SUPPORT_EMAIL = SITE_CONFIG.email || "kaptainbites@gmail.com";
const cartApi = window.KAPTAINBITES_CART || null;
const productQuantities = new Map();

function normalizeSearchQuery(query = "") {
  return query.trim().toLowerCase();
}

function getProductById(productId) {
  return PRODUCT_CATALOG.find((product) => product.id === productId);
}

function getFilteredProducts(query = "") {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return PRODUCT_CATALOG;
  }

  return PRODUCT_CATALOG.filter((product) => {
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

function buildSearchKeywords(query, matches) {
  const normalizedQuery = normalizeSearchQuery(query);
  const keywordPool = new Set();

  matches.forEach((product) => {
    product.searchTerms.forEach((term) => keywordPool.add(term));
  });

  PRODUCT_CATALOG.forEach((product) => {
    product.searchTerms.forEach((term) => keywordPool.add(term));
  });

  return Array.from(keywordPool).filter((term) => {
    if (!normalizedQuery) {
      return true;
    }

    return term.includes(normalizedQuery) || normalizedQuery.includes(term);
  }).slice(0, 6);
}

function buildOrderMessage(product, quantity = 1) {
  const total = product.price * quantity;

  return `Hi, I want to order:\n\nProduct: ${product.name}\nPack Size: ${product.weight}\nQuantity: ${quantity}\nPrice per pack: Rs.${product.price}\nTotal: Rs.${total}\n\nPlease share payment details.`;
}

function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function quickWhatsApp(message = "Hi! I'm interested in ordering KaptainBites snacks. Can you help me?") {
  openWhatsApp(message);
}

function flashButtonFeedback(button, label) {
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

function setupMobileNavigation() {
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

function buildProductCard(product) {
  const quantity = productQuantities.get(product.id) || 1;

  return `
    <article class="product-card product-card--${product.theme} fade-in" data-product-id="${product.id}">
      <a class="product-img-wrap" href="${product.pageUrl}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.alt}" loading="lazy">
      </a>
      <div class="product-info">
        <p class="product-line">${product.line}</p>
        <h3 class="product-name"><a href="${product.pageUrl}">${product.name}</a></h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-meta">
          <span>${product.weight}</span>
          <span>No Preservatives</span>
        </div>
        <div class="product-footer">
          <div class="product-price-row">
            <div class="product-price">Rs.${product.price} <span class="product-price__unit">/ pack</span></div>
            ${product.originalPrice ? `<span class="product-price__original">Rs.${product.originalPrice}</span>` : ""}
          </div>
          <div class="product-card__purchase">
            <div class="product-card__controls">
              <div class="quantity-control quantity-control--catalog" aria-label="Select quantity for ${product.name}">
                <button type="button" class="qty-btn" data-action="decrease" aria-label="Decrease quantity for ${product.name}">-</button>
                <span class="qty-value" data-qty>${quantity}</span>
                <button type="button" class="qty-btn" data-action="increase" aria-label="Increase quantity for ${product.name}">+</button>
              </div>
              <button class="product-card__quick cart-btn" type="button" data-add-to-cart="${product.id}">Add to Cart</button>
            </div>
            <button class="product-card__quick product-card__quick--whatsapp order-btn" type="button">Order on WhatsApp</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedProducts() {
  document.querySelectorAll("[data-featured-grid]").forEach((grid) => {
    const limit = Number.parseInt(grid.dataset.limit || PRODUCT_CATALOG.length, 10);
    grid.innerHTML = PRODUCT_CATALOG.slice(0, limit).map(buildProductCard).join("");
  });
}

function updateCatalogCounts(visibleCount, query) {
  const productCount = document.getElementById("product-count");

  if (!productCount) {
    return;
  }

  productCount.textContent = query
    ? `${visibleCount} result${visibleCount === 1 ? "" : "s"} found`
    : `${visibleCount} snacks available`;
}

function renderShopCatalog(query = "") {
  const grid = document.getElementById("products-grid");
  const emptyState = document.getElementById("catalog-empty");
  const normalizedQuery = normalizeSearchQuery(query);

  if (!grid) {
    return;
  }

  const filteredProducts = getFilteredProducts(normalizedQuery);
  grid.innerHTML = filteredProducts.map(buildProductCard).join("");
  updateCatalogCounts(filteredProducts.length, normalizedQuery);

  if (emptyState) {
    emptyState.hidden = filteredProducts.length !== 0;
  }
}

function buildSearchProductResult(product) {
  return `
    <button type="button" class="search-result" data-product-id="${product.id}">
      <img src="${product.image}" class="search-result__image" alt="${product.alt}">
      <span class="search-result__copy">
        <span class="search-result__name">${product.name}</span>
        <span class="search-result__meta">${product.weight} | Rs.${product.price}</span>
      </span>
    </button>
  `;
}

function setupSearch() {
  const searchForm = document.querySelector(".site-search");
  const searchInput = document.getElementById("product-search");
  const searchClear = document.querySelector(".site-search__clear");
  const searchDropdown = document.getElementById("search-dropdown");
  const searchKeywords = document.getElementById("search-keywords");
  const suggestionsList = document.getElementById("search-suggestions-list");
  const searchViewAll = document.getElementById("search-view-all");
  const hasCatalog = Boolean(document.getElementById("products-grid"));

  if (!searchForm || !searchInput || !searchDropdown || !searchKeywords || !suggestionsList || !searchViewAll) {
    return;
  }

  function updateClearButton() {
    if (searchClear) {
      searchClear.hidden = searchInput.value.trim().length === 0;
    }
  }

  function hideSuggestions() {
    searchDropdown.hidden = true;
    searchKeywords.innerHTML = "";
    suggestionsList.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
  }

  function showCatalogResults(query) {
    const normalizedQuery = normalizeSearchQuery(query);

    if (!hasCatalog) {
      const targetUrl = normalizedQuery
        ? `${PRODUCTS_PAGE_URL}?q=${encodeURIComponent(normalizedQuery)}`
        : PRODUCTS_PAGE_URL;
      window.location.href = targetUrl;
      return;
    }

    renderShopCatalog(normalizedQuery);
    const nextUrl = normalizedQuery
      ? `${window.location.pathname}?q=${encodeURIComponent(normalizedQuery)}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
    hideSuggestions();

    const grid = document.getElementById("products-grid");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderSuggestions(query) {
    const normalizedQuery = normalizeSearchQuery(query);
    updateClearButton();

    if (!normalizedQuery) {
      hideSuggestions();
      if (hasCatalog) {
        renderShopCatalog("");
      }
      return;
    }

    const matches = getFilteredProducts(normalizedQuery).slice(0, 4);
    const keywords = buildSearchKeywords(normalizedQuery, matches);

    searchKeywords.innerHTML = keywords.length
      ? keywords.map((keyword) => `<button type="button" class="search-chip" data-keyword="${keyword}">${keyword}</button>`).join("")
      : `<p class="site-search__empty">No suggestions yet.</p>`;

    suggestionsList.innerHTML = matches.length
      ? matches.map(buildSearchProductResult).join("")
      : `<p class="site-search__empty">No matching snacks found.</p>`;

    searchDropdown.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  searchInput.addEventListener("input", () => {
    renderSuggestions(searchInput.value);
    if (hasCatalog) {
      renderShopCatalog(searchInput.value);
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderSuggestions(searchInput.value);
    }
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showCatalogResults(searchInput.value);
  });

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      updateClearButton();
      hideSuggestions();
      if (hasCatalog) {
        renderShopCatalog("");
      }
      window.history.replaceState({}, "", window.location.pathname);
      searchInput.focus();
    });
  }

  searchKeywords.addEventListener("click", (event) => {
    const keywordButton = event.target.closest("[data-keyword]");
    if (!keywordButton) {
      return;
    }

    searchInput.value = keywordButton.dataset.keyword;
    renderSuggestions(searchInput.value);
    if (hasCatalog) {
      renderShopCatalog(searchInput.value);
    }
  });

  suggestionsList.addEventListener("click", (event) => {
    const result = event.target.closest("[data-product-id]");
    if (!result) {
      return;
    }

    const product = getProductById(result.dataset.productId);
    if (product) {
      window.location.href = product.pageUrl;
    }
  });

  searchViewAll.addEventListener("click", () => {
    showCatalogResults(searchInput.value);
  });

  document.addEventListener("click", (event) => {
    if (searchForm.contains(event.target) || searchDropdown.contains(event.target)) {
      return;
    }

    hideSuggestions();
  });

  const initialQuery = new URLSearchParams(window.location.search).get("q");
  if (initialQuery) {
    searchInput.value = initialQuery;
    updateClearButton();
    if (hasCatalog) {
      renderShopCatalog(initialQuery);
    }
  } else {
    updateClearButton();
  }
}


function hasCartSidebar() {
  return Boolean(document.querySelector(".cart-overlay") && document.querySelector(".cart-sidebar"));
}

function setupGlobalActions() {
  document.addEventListener("click", (event) => {
    const quickButton = event.target.closest("[data-quick-whatsapp]");
    if (quickButton) {
      event.preventDefault();
      quickWhatsApp();
      return;
    }

    const productCardButton = event.target.closest(".product-card button");
    if (productCardButton) {
      const productCard = productCardButton.closest(".product-card");
      const productId = productCard?.dataset.productId;
      const product = getProductById(productId);

      if (!productCard || !productId || !product) {
        return;
      }

      if (productCardButton.classList.contains("qty-btn")) {
        const currentQuantity = productQuantities.get(productId) || 1;
        const nextQuantity = productCardButton.dataset.action === "increase"
          ? currentQuantity + 1
          : Math.max(1, currentQuantity - 1);

        productQuantities.set(productId, nextQuantity);
        const quantityValue = productCard.querySelector("[data-qty]");
        if (quantityValue) {
          quantityValue.textContent = String(nextQuantity);
        }
        return;
      }

      if (productCardButton.classList.contains("order-btn")) {
        event.preventDefault();
        openWhatsApp(buildOrderMessage(product, productQuantities.get(productId) || 1));
        return;
      }

      if (productCardButton.classList.contains("cart-btn") && cartApi) {
        cartApi.addCartItem(productId, productQuantities.get(productId) || 1);
        flashButtonFeedback(productCardButton, "Added");
        return;
      }
    }

    const addToCartButton = event.target.closest("[data-add-to-cart]");
    if (addToCartButton && cartApi) {
      const productId = addToCartButton.dataset.addToCart;
      cartApi.addCartItem(productId, 1);
      flashButtonFeedback(addToCartButton, "Added");
    }
  });
}

function setupContactForm() {
  const contactForm = document.getElementById("contact-form");

  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    const formData = new FormData(contactForm);
    const subjectValue = formData.get("subject");
    const subjectOption = contactForm.querySelector(`[name="subject"] option[value="${subjectValue}"]`);

    let waMsg = "Hi, I want to contact KaptainBites.\n\n";
    waMsg += `Name: ${formData.get("name")}\n`;

    if (formData.get("email")) {
      waMsg += `Email: ${formData.get("email")}\n`;
    }

    if (formData.get("phone")) {
      waMsg += `Phone: ${formData.get("phone")}\n`;
    }

    if (subjectOption && subjectOption.textContent) {
      waMsg += `Subject: ${subjectOption.textContent}\n`;
    }

    waMsg += `\nMessage:\n${formData.get("message")}`;

    openWhatsApp(waMsg);
    contactForm.reset();
    window.alert(`Thanks! We opened WhatsApp with your message. You can also email us at ${SUPPORT_EMAIL}.`);
  });
}

function initFadeAnimations() {
  const fadeItems = document.querySelectorAll(".fade-in");

  if (!fadeItems.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    fadeItems.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("visible");
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -30px 0px"
  });

  fadeItems.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
  setupMobileNavigation();
  renderFeaturedProducts();
  renderShopCatalog(new URLSearchParams(window.location.search).get("q") || "");
  setupSearch();
  setupGlobalActions();
  setupContactForm();
  initFadeAnimations();
});

window.quickWhatsApp = quickWhatsApp;
window.KAPTAINBITES_SITE = {
  openWhatsApp,
  buildOrderMessage,
  getProductById
};
