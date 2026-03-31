const CART_PAGE_CONFIG = window.KAPTAINBITES_CONFIG || {};
const CART_PAGE_WHATSAPP = CART_PAGE_CONFIG.whatsappNumber || "917760172150";
const CART_PAGE_PATHS = window.KAPTAINBITES_PATHS || {};
const CART_PAGE_SHOP_URL = CART_PAGE_PATHS.shopUrl || "shop.html";

function openCartWhatsApp(message) {
  const url = `https://wa.me/${CART_PAGE_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function renderCartPage() {
  const container = document.getElementById("cart-shell");
  const catalog = Array.isArray(window.KAPTAINBITES_PRODUCTS) ? window.KAPTAINBITES_PRODUCTS : [];
  const cartApi = window.KAPTAINBITES_CART;

  if (!container || !cartApi) {
    return;
  }

  const cartItems = cartApi.getCartItems(catalog);
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const grandTotal = cartItems.reduce((total, item) => total + item.lineTotal, 0);

  if (!cartItems.length) {
    container.innerHTML = `
      <section class="cart-empty-state fade-in visible">
        <h2>Your cart is empty</h2>
        <p>Add your favorite snacks and come back here before checkout.</p>
        <a class="btn-primary" href="${CART_PAGE_SHOP_URL}">Explore Products</a>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <div class="cart-page-grid">
      <section class="cart-card fade-in visible">
        <div class="cart-card__header">
          <div>
            <span class="tag">Order Review</span>
            <h2>Your Selections</h2>
          </div>
          <p>${itemCount} item${itemCount === 1 ? "" : "s"} in cart</p>
        </div>
        <div class="cart-list">
          ${cartItems.map((item) => `
            <article class="cart-item-row" data-product-id="${item.product.id}">
              <a class="cart-item-row__media" href="${item.product.pageUrl}">
                <img src="${item.product.image}" alt="${item.product.alt}">
              </a>
              <div class="cart-item-row__content">
                <div>
                  <p class="cart-item-row__eyebrow">${item.product.line}</p>
                  <h3><a href="${item.product.pageUrl}">${item.product.name}</a></h3>
                  <p class="cart-item-row__meta">${item.product.weight} | Rs.${item.product.price} per pack</p>
                </div>
                <div class="cart-item-row__actions">
                  <div class="quantity-control" aria-label="Update quantity for ${item.product.name}">
                    <button type="button" class="qty-btn" data-action="decrease">-</button>
                    <span class="qty-value" data-qty>${item.quantity}</span>
                    <button type="button" class="qty-btn" data-action="increase">+</button>
                  </div>
                  <strong>Rs.${item.lineTotal}</strong>
                  <button type="button" class="cart-item-row__remove">Remove</button>
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
      <aside class="cart-summary-panel fade-in visible">
        <span class="tag">Checkout</span>
        <h2>Order Summary</h2>
        <div class="cart-summary-panel__row">
          <span>Items</span>
          <strong>${itemCount}</strong>
        </div>
        <div class="cart-summary-panel__row">
          <span>Subtotal</span>
          <strong>Rs.${grandTotal}</strong>
        </div>
        <div class="cart-summary-panel__row cart-summary-panel__row--total">
          <span>Total</span>
          <strong>Rs.${grandTotal}</strong>
        </div>
        <p>Checkout directly on WhatsApp and we'll confirm payment and delivery with you.</p>
        <div class="cart-summary-panel__actions">
          <button type="button" class="btn-primary" id="cart-checkout">Checkout on WhatsApp</button>
          <button type="button" class="btn-secondary" id="cart-clear">Clear Cart</button>
          <a class="btn-secondary" href="${CART_PAGE_SHOP_URL}">Continue Shopping</a>
        </div>
      </aside>
    </div>
  `;

  container.querySelectorAll(".cart-item-row").forEach((row) => {
    const productId = row.dataset.productId;

    row.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      const currentQuantity = cartApi.getCart()[productId] || 1;

      if (button.classList.contains("qty-btn")) {
        const nextQuantity = button.dataset.action === "increase"
          ? currentQuantity + 1
          : currentQuantity - 1;

        cartApi.setCartItem(productId, nextQuantity);
        renderCartPage();
        return;
      }

      if (button.classList.contains("cart-item-row__remove")) {
        cartApi.setCartItem(productId, 0);
        renderCartPage();
      }
    });
  });

  document.getElementById("cart-checkout")?.addEventListener("click", () => {
    openCartWhatsApp(cartApi.buildCartOrderMessage(catalog));
  });

  document.getElementById("cart-clear")?.addEventListener("click", () => {
    cartApi.clearCart();
    renderCartPage();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
  window.addEventListener("kaptainbites:cart-updated", renderCartPage);
});



