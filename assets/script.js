/* assets/script.js
   Weekenders Co. - simple cart + email checkout
   Edit ORDER_EMAIL to receive order emails.
*/

const ORDER_EMAIL = "orders@weekendersco.com"; // <-- change this to your order email

// Product metadata — change if needed
const PRODUCT = {
  title: "The Summit Beanie",
  sku: "WDR-SUMMIT-01",
  price: 45.00 // USD number
};

// -------- helper functions --------
function formatMoney(n) {
  return "$" + Number(n).toFixed(2);
}

function safeQuery(id) {
  return document.getElementById(id);
}

// -------- cart helpers (localStorage) --------
const CART_KEY = "w_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (e) {
    console.warn("Failed to parse cart from localStorage. Resetting cart.", e);
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
  saveCart([]);
}

// Build a plain text order summary
function orderText(items) {
  let total = 0;
  const lines = ["Order from Weekenders Co.", "", "Items:"];
  items.forEach(it => {
    lines.push(`${it.title} (SKU ${it.sku}) x ${it.qty} - ${formatMoney(it.price)} each - ${formatMoney(it.price * it.qty)}`);
    total += it.price * it.qty;
  });
  lines.push("", `Total: ${formatMoney(total)}`, "", "Customer details: (paste name, address, phone here)");
  return lines.join("\n");
}

// Open user's mail client with prefilled order (mailto)
function emailCheckout(items) {
  const subject = encodeURIComponent(`Weekenders Co. order - ${new Date().toISOString().slice(0,10)}`);
  const body = encodeURIComponent(orderText(items));
  const mailto = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
  // navigate to mailto to open email client
  window.location.href = mailto;
}

// -------- render cart UI --------
function renderCartUI() {
  const cartSummary = safeQuery("cartSummary");
  const cartItems = safeQuery("cartItems");
  const cartTotalEl = safeQuery("cartTotal");

  if (!cartSummary || !cartItems || !cartTotalEl) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartSummary.style.display = "none";
    return;
  }

  cartSummary.style.display = "block";
  cartItems.innerHTML = "";

  let total = 0;
  cart.forEach(item => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.padding = "6px 0";
    row.innerHTML = `<div>${escapeHtml(item.title)} x ${item.qty}</div><div>${formatMoney(item.qty * item.price)}</div>`;
    cartItems.appendChild(row);
    total += item.qty * item.price;
  });

  cartTotalEl.textContent = formatMoney(total);
}

// minimal escape for inserted text
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------- main init --------
function init() {
  // Elements that should exist on product page
  const qtyInput = safeQuery("qty");
  const inc = safeQuery("inc");
  const dec = safeQuery("dec");
  const addToCart = safeQuery("addToCart");
  const buyNow = safeQuery("buyNow");
  const checkoutEmail = safeQuery("checkoutEmail");
  const copyOrder = safeQuery("copyOrder");
  const priceEl = safeQuery("price");

  // Set price display if element exists
  if (priceEl) priceEl.textContent = formatMoney(PRODUCT.price);

  // quantity controls (if present)
  if (qtyInput) {
    // ensure numeric default
    qtyInput.value = Math.max(1, parseInt(qtyInput.value || "1", 10));
  }
  if (inc && qtyInput) {
    inc.addEventListener("click", () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || "1", 10) + 1);
    });
  }
  if (dec && qtyInput) {
    dec.addEventListener("click", () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value || "1", 10) - 1);
    });
  }

  // Add to cart
  if (addToCart && qtyInput) {
    addToCart.addEventListener("click", () => {
      const qty = Math.max(1, parseInt(qtyInput.value || "1", 10));
      const cart = getCart();
      const index = cart.findIndex(i => i.sku === PRODUCT.sku);
      if (index >= 0) {
        cart[index].qty += qty;
      } else {
        cart.push({ sku: PRODUCT.sku, title: PRODUCT.title, price: PRODUCT.price, qty });
      }
      saveCart(cart);
      renderCartUI();
      // brief visual feedback
      addToCart.textContent = "Added";
      setTimeout(() => addToCart.textContent = "Add to cart", 900);
    });
  }

  // Buy now (immediate mailto for single product)
  if (buyNow && qtyInput) {
    buyNow.addEventListener("click", () => {
      const qty = Math.max(1, parseInt(qtyInput.value || "1", 10));
      const order = [{ sku: PRODUCT.sku, title: PRODUCT.title, price: PRODUCT.price, qty }];
      emailCheckout(order);
    });
  }

  // Checkout via email (uses cart)
  if (checkoutEmail) {
    checkoutEmail.addEventListener("click", () => {
      const cart = getCart();
      if (!cart || cart.length === 0) {
        alert("Cart is empty.");
        return;
      }
      emailCheckout(cart);
    });
  }

  // Copy order text to clipboard
  if (copyOrder) {
    copyOrder.addEventListener("click", async () => {
      const cart = getCart();
      if (!cart || cart.length === 0) {
        alert("Cart is empty.");
        return;
      }
      const txt = orderText(cart);
      try {
        await navigator.clipboard.writeText(txt);
        alert("Order copied to clipboard.");
      } catch (e) {
        // fallback: open a prompt with the text so user can copy manually
        window.prompt("Copy your order", txt);
      }
    });
  }

  // Optional: hide cart summary if empty on load
  renderCartUI();
}

// run when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
