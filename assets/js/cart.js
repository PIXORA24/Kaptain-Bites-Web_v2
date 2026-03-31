const KAPTAINBITES_CART_STORAGE_KEY = "kaptainbites-cart-v2";
const KAPTAINBITES_CART_EVENT = "kaptainbites:cart-updated";

function readStoredCart() {
  try {
    const rawCart = window.localStorage.getItem(KAPTAINBITES_CART_STORAGE_KEY);
    if (!rawCart) {
      return {};
    }

    const parsedCart = JSON.parse(rawCart);
    if (!parsedCart || typeof parsedCart !== "object") {
      return {};
    }

    return Object.entries(parsedCart).reduce((cart, [productId, quantity]) => {
      const normalizedQuantity = Number.parseInt(quantity, 10);
      if (Number.isFinite(normalizedQuantity) && normalizedQuantity > 0) {
        cart[productId] = normalizedQuantity;
      }
      return cart;
    }, {});
  } catch (error) {
    return {};
  }
}

function saveStoredCart(cart) {
  try {
    window.localStorage.setItem(KAPTAINBITES_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    return;
  }

  window.dispatchEvent(new CustomEvent(KAPTAINBITES_CART_EVENT, {
    detail: cart
  }));
}

function getCart() {
  return readStoredCart();
}

function getCartCount() {
  return Object.values(getCart()).reduce((total, quantity) => total + quantity, 0);
}

function setCartItem(productId, quantity) {
  if (!productId) {
    return;
  }

  const cart = getCart();
  const normalizedQuantity = Number.parseInt(quantity, 10);

  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = normalizedQuantity;
  }

  saveStoredCart(cart);
}

function addCartItem(productId, quantity = 1) {
  if (!productId) {
    return;
  }

  const cart = getCart();
  const normalizedQuantity = Number.parseInt(quantity, 10);
  const nextQuantity = (cart[productId] || 0) + (Number.isFinite(normalizedQuantity) ? normalizedQuantity : 1);

  cart[productId] = Math.max(nextQuantity, 1);
  saveStoredCart(cart);
}

function clearCart() {
  saveStoredCart({});
}

function getCartItems(catalog) {
  const cart = getCart();
  const catalogList = Array.isArray(catalog) ? catalog : [];

  return Object.entries(cart).map(([productId, quantity]) => {
    const product = catalogList.find((item) => item.id === productId);
    if (!product) {
      return null;
    }

    return {
      product,
      quantity,
      lineTotal: product.price * quantity
    };
  }).filter(Boolean);
}

function buildCartOrderMessage(catalog) {
  const items = getCartItems(catalog);
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (!items.length) {
    return "Hi, I want to know more about KaptainBites snacks.";
  }

  const orderLines = items.map((item, index) => {
    return `${index + 1}. ${item.product.name} (${item.product.weight}) x ${item.quantity} = Rs.${item.lineTotal}`;
  });

  return `Hi, I want to order from KaptainBites:\n\n${orderLines.join("\n")}\n\nTotal: Rs.${total}\n\nPlease share payment details and delivery options.`;
}

function updateCartBadges() {
  const totalCount = getCartCount();

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(totalCount);
    badge.hidden = totalCount === 0;
  });
}

window.addEventListener("storage", updateCartBadges);
window.addEventListener(KAPTAINBITES_CART_EVENT, updateCartBadges);
document.addEventListener("DOMContentLoaded", updateCartBadges);

window.KAPTAINBITES_CART = {
  getCart,
  getCartCount,
  setCartItem,
  addCartItem,
  clearCart,
  getCartItems,
  buildCartOrderMessage,
  updateCartBadges
};
