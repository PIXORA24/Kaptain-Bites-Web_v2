(function () {
  const cartApi = window.KAPTAINBITES_CART || null;
  const catalog = Array.isArray(window.KAPTAINBITES_PRODUCTS) ? window.KAPTAINBITES_PRODUCTS : [];

  function hasDrawer() {
    return Boolean(document.querySelector(".cart-overlay") && document.querySelector(".cart-sidebar"));
  }

  function getDrawerItems() {
    if (!cartApi) {
      return [];
    }

    return cartApi.getCartItems(catalog);
  }

  function renderCartDrawer() {
    const itemsContainer = document.querySelector(".cart-items");
    const footer = document.querySelector(".cart-footer");
    const totalElement = document.querySelector(".cart-total strong");
    const items = getDrawerItems();

    if (!itemsContainer) {
      return;
    }

    if (!items.length) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          <div class="empty-icon">Cart</div>
          <p>Your cart is empty</p>
          <p style="font-size:0.85rem;margin-top:8px">Browse our delicious snacks!</p>
        </div>
      `;

      if (footer) {
        footer.style.display = "none";
      }

      if (totalElement) {
        totalElement.textContent = "Rs.0";
      }

      return;
    }

    itemsContainer.innerHTML = items.map((item) => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.product.thumb || item.product.image}" alt="${item.product.alt}" loading="lazy" decoding="async" width="520" height="520">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-price">Rs.${item.product.price} x ${item.quantity} = Rs.${item.lineTotal}</div>
          <div class="cart-qty">
            <button type="button" data-cart-decrease="${item.product.id}" aria-label="Decrease quantity">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-increase="${item.product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-item-remove" type="button" data-cart-remove="${item.product.id}" aria-label="Remove item">x</button>
      </div>
    `).join("");

    if (footer) {
      footer.style.display = "block";
    }

    if (totalElement) {
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
      totalElement.textContent = `Rs.${total}`;
    }
  }

  function openCartDrawer() {
    const overlay = document.querySelector(".cart-overlay");
    const sidebar = document.querySelector(".cart-sidebar");

    if (!overlay || !sidebar) {
      return;
    }

    overlay.classList.add("open");
    sidebar.classList.add("open");
    document.body.style.overflow = "hidden";
    renderCartDrawer();
  }

  function closeCartDrawer() {
    const overlay = document.querySelector(".cart-overlay");
    const sidebar = document.querySelector(".cart-sidebar");

    if (!overlay || !sidebar) {
      return;
    }

    overlay.classList.remove("open");
    sidebar.classList.remove("open");
    document.body.style.overflow = "";
  }

  function updateCartQuantity(productId, delta) {
    if (!cartApi || !productId) {
      return;
    }

    const currentCart = cartApi.getCart();
    const currentQuantity = Number.parseInt(currentCart[productId] || 0, 10);
    cartApi.setCartItem(productId, currentQuantity + delta);
  }

  function removeCartItem(productId) {
    if (!cartApi || !productId) {
      return;
    }

    cartApi.setCartItem(productId, 0);
  }

  function orderCartViaWhatsApp() {
    const siteApi = window.KAPTAINBITES_SITE || null;

    if (!cartApi || !siteApi || typeof siteApi.openWhatsApp !== "function") {
      return;
    }

    siteApi.openWhatsApp(cartApi.buildCartOrderMessage(catalog));
  }

  function browseMoreProducts() {
    const isShopPage = window.location.pathname.toLowerCase().endsWith("shop.html");
    const catalogGrid = document.getElementById("products-grid");

    if (isShopPage && catalogGrid) {
      closeCartDrawer();
      catalogGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.location.href = (window.KAPTAINBITES_PATHS && window.KAPTAINBITES_PATHS.shopUrl) || "shop.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!hasDrawer()) {
      return;
    }

    const overlay = document.querySelector(".cart-overlay");
    const closeButton = document.querySelector(".cart-close");
    const cartButton = document.querySelector(".nav-cart");

    cartButton?.addEventListener("click", (event) => {
      event.preventDefault();
      openCartDrawer();
    });

    closeButton?.addEventListener("click", closeCartDrawer);
    overlay?.addEventListener("click", closeCartDrawer);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCartDrawer();
      }
    });

    document.addEventListener("click", (event) => {
      const drawerTrigger = event.target.closest("[data-open-cart]");
      if (drawerTrigger) {
        event.preventDefault();
        openCartDrawer();
        return;
      }

      const addToCartButton = event.target.closest("[data-add-to-cart]");
      if (addToCartButton) {
        window.setTimeout(openCartDrawer, 0);
        return;
      }

      const decreaseButton = event.target.closest("[data-cart-decrease]");
      if (decreaseButton) {
        updateCartQuantity(decreaseButton.dataset.cartDecrease, -1);
        return;
      }

      const increaseButton = event.target.closest("[data-cart-increase]");
      if (increaseButton) {
        updateCartQuantity(increaseButton.dataset.cartIncrease, 1);
        return;
      }

      const removeButton = event.target.closest("[data-cart-remove]");
      if (removeButton) {
        removeCartItem(removeButton.dataset.cartRemove);
        return;
      }

      const orderButton = event.target.closest("[data-order-cart]");
      if (orderButton) {
        orderCartViaWhatsApp();
        return;
      }

      const browseButton = event.target.closest("[data-browse-products]");
      if (browseButton) {
        event.preventDefault();
        browseMoreProducts();
      }
    });

    window.addEventListener("kaptainbites:cart-updated", renderCartDrawer);
    window.addEventListener("storage", renderCartDrawer);
    renderCartDrawer();
  });
})();


