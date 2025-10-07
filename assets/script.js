// Simple cart + email checkout
// Edit the ORDER_EMAIL to your real order address
const ORDER_EMAIL = "orders@weekendersco.com"; // <-- EDIT THIS

// product metadata — change if needed
const PRODUCT = {
  title: "Navy Dog Skiing Beanie",
  sku: "WDR-BEANIE-01",
  price: 45.00, // number, USD
};

function formatMoney(n){
  return "$" + n.toFixed(2);
}

function init() {
  const qtyInput = document.getElementById('qty');
  const inc = document.getElementById('inc');
  const dec = document.getElementById('dec');
  const addToCart = document.getElementById('addToCart');
  const buyNow = document.getElementById('buyNow');
  const cartSummary = document.getElementById('cartSummary');
  const cartItems = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutEmail = document.getElementById('checkoutEmail');
  const copyOrder = document.getElementById('copyOrder');
  const priceEl = document.getElementById('price');
  priceEl.textContent = formatMoney(PRODUCT.price);

  // quantity buttons
  inc.onclick = ()=> qtyInput.value = parseInt(qtyInput.value || 1) + 1;
  dec.onclick = ()=> {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1) - 1);
  };

  // cart stored in localStorage for tiny store
  function getCart(){ return JSON.parse(localStorage.getItem('w_cart') || '[]'); }
  function saveCart(c){ localStorage.setItem('w_cart', JSON.stringify(c)); }

  function renderCart(){
    const cart = getCart();
    if(cart.length === 0){
      cartSummary.style.display = 'none';
      return;
    }
    cartSummary.style.display = 'block';
    cartItems.innerHTML = '';
    let total = 0;
    cart.forEach((item, i) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.padding = '6px 0';
      row.innerHTML = `<div>${item.title} × ${item.qty}</div><div>${formatMoney(item.qty * item.price)}</div>`;
      cartItems.appendChild(row);
      total += item.qty * item.price;
    });
    cartTotalEl.textContent = formatMoney(total);
  }

  addToCart.onclick = ()=>{
    const qty = Math.max(1, parseInt(qtyInput.value || 1));
    const cart = getCart();
    const existsIndex = cart.findIndex(i => i.sku === PRODUCT.sku);
    if(existsIndex >= 0){
      cart[existsIndex].qty += qty;
    } else {
      cart.push({ sku: PRODUCT.sku, title: PRODUCT.title, price: PRODUCT.price, qty });
    }
    saveCart(cart);
    renderCart();
  };

  buyNow.onclick = ()=>{
    const qty = Math.max(1, parseInt(qtyInput.value || 1));
    const order = [{ sku: PRODUCT.sku, title: PRODUCT.title, price: PRODUCT.price, qty }];
    emailCheckout(order);
  };

  checkoutEmail.onclick = ()=>{
    const cart = getCart();
    if(cart.length === 0) { alert("Cart is empty."); return; }
    emailCheckout(cart);
  };

  copyOrder.onclick = ()=>{
    const cart = getCart();
    if(cart.length === 0) { alert("Cart is empty."); return; }
    const text = orderText(cart);
    navigator.clipboard.writeText(text).then(()=> alert("Order copied to clipboard."));
  };

  function orderText(items){
    let total = 0;
    let lines = [`Order from Weekenders Co.`, ``, `Items:`];
    items.forEach(it=>{
      lines.push(`${it.title} (SKU ${it.sku}) × ${it.qty} — ${formatMoney(it.price)} each — ${formatMoney(it.price * it.qty)}`);
      total += it.price * it.qty;
    });
    lines.push('', `Total: ${formatMoney(total)}`, '', 'Customer details: (paste name, address, phone here)');
    return lines.join('\n');
  }

  function emailCheckout(items){
    const subject = encodeURIComponent(`Weekenders Co. order — ${new Date().toISOString().slice(0,10)}`);
    const body = encodeURIComponent(orderText(items));
    // mailto link
    const mailto = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
    // open mail client
    window.location.href = mailto;
  }

  // initial render
  renderCart();
}

document.addEventListener('DOMContentLoaded', init);
