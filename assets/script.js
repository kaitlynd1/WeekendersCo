/* assets/script.js
   Weekenders Co. — simple cart + variants + email checkout
   Set window.PRODUCT in each PDP before loading this file.
*/

const ORDER_EMAIL = "orders@weekendersco.com"; // change if needed

// -------- helpers --------
function formatMoney(n){ return "$" + Number(n).toFixed(2); }
function el(id){ return document.getElementById(id); }
function escapeHtml(str){ return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// -------- cart storage --------
const CART_KEY = "w_cart";
function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch(e){ localStorage.removeItem(CART_KEY); return []; } }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function clearCart(){ saveCart([]); }

// -------- product --------
function currentProduct(){
  const fallback = { title:"Product", sku:"SKU-UNKNOWN", price:0, options:[] };
  const p = (typeof window !== "undefined" && window.PRODUCT) ? window.PRODUCT : fallback;
  // normalize
  p.options = Array.isArray(p.options) ? p.options : [];
  p.optionValues = p.optionValues || {};
  return p;
}

// Build a plain text order summary
function orderText(items){
  let total = 0;
  const lines = ["Order from Weekenders Co.", "", "Items:"];
  items.forEach(it=>{
    const opts = it.selectedOptions && Object.keys(it.selectedOptions).length
      ? " [" + Object.entries(it.selectedOptions).map(([k,v])=>`${k}: ${v}`).join(", ") + "]"
      : "";
    lines.push(`${it.title}${opts} (SKU ${it.sku}) x ${it.qty} - ${formatMoney(it.price)} each - ${formatMoney(it.price*it.qty)}`);
    total += it.price * it.qty;
  });
  lines.push("", `Total: ${formatMoney(total)}`, "", "Customer details: (paste name, address, phone here)");
  return lines.join("\n");
}

function emailCheckout(items){
  const subject = encodeURIComponent(`Weekenders Co. order - ${new Date().toISOString().slice(0,10)}`);
  const body = encodeURIComponent(orderText(items));
  window.location.href = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${body}`;
}

// -------- UI: render cart summary --------
function renderCartUI(){
  const cartSummary = el("cartSummary");
  const cartItems = el("cartItems");
  const cartTotal = el("cartTotal");
  if(!cartSummary || !cartItems || !cartTotal) return;

  const cart = getCart();
  if(cart.length === 0){ cartSummary.style.display = "none"; return; }
  cartSummary.style.display = "block";
  cartItems.innerHTML = "";

  let total = 0;
  cart.forEach(it=>{
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.padding = "6px 0";
    const opts = it.selectedOptions && Object.keys(it.selectedOptions).length
      ? " [" + Object.entries(it.selectedOptions).map(([k,v])=>`${escapeHtml(k)}: ${escapeHtml(v)}`).join(", ") + "]"
      : "";
    row.innerHTML = `<div>${escapeHtml(it.title)}${opts} x ${it.qty}</div><div>${formatMoney(it.qty * it.price)}</div>`;
    cartItems.appendChild(row);
    total += it.qty * it.price;
  });
  cartTotal.textContent = formatMoney(total);
}

// -------- options handling (size, etc.) --------
function renderOptions(p){
  const wrap = el("options");
  if(!wrap || !p.options || p.options.length === 0) return {};

  const selected = {};
  p.options.forEach(name=>{
    const values = p.optionValues[name] || [];
    values.forEach((v, idx)=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt-btn";
      btn.textContent = v;
      btn.dataset.optName = name;
      btn.dataset.optValue = v;
      if(idx === 2 || (idx === 1 && values.length <= 3)){ // pick a sensible default (M if exists)
        selected[name] = v;
        btn.classList.add("active");
      }
      btn.addEventListener("click", ()=>{
        // deactivate siblings
        wrap.querySelectorAll(`.opt-btn[data-opt-name="${name}"]`).forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        selected[name] = v;
      });
      wrap.appendChild(btn);
    });
  });
  return selected;
}

// -------- main init --------
function init(){
  const p = currentProduct();

  // price
  const priceEl = el("price");
  if(priceEl) priceEl.textContent = formatMoney(p.price);

  // qty controls
  const qty = el("qty"), inc = el("inc"), dec = el("dec");
  if(qty){ qty.value = Math.max(1, parseInt(qty.value||"1",10)); }
  if(inc && qty){ inc.addEventListener("click", ()=> qty.value = Math.max(1, parseInt(qty.value||"1",10)+1)); }
  if(dec && qty){ dec.addEventListener("click", ()=> qty.value = Math.max(1, parseInt(qty.value||"1",10)-1)); }

  // options
  let selectedOptions = renderOptions(p);

  // add to cart
  const add = el("addToCart");
  if(add && qty){
    add.addEventListener("click", ()=>{
      const q = Math.max(1, parseInt(qty.value||"1",10));
      // collect latest selected
      const btnActive = document.querySelectorAll(".opt-btn.active");
      selectedOptions = {};
      btnActive.forEach(b=> selectedOptions[b.dataset.optName] = b.dataset.optValue);

      const cart = getCart();
      // consider sku + options as unique key
      const key = p.sku + JSON.stringify(selectedOptions||{});
      const idx = cart.findIndex(i => (i.key === key));
      if(idx >= 0){
        cart[idx].qty += q;
      } else {
        cart.push({
          key,
          sku: p.sku,
          title: p.title,
          price: p.price,
          qty: q,
          selectedOptions
        });
      }
      saveCart(cart);
      renderCartUI();
      add.textContent = "Added";
      setTimeout(()=> add.textContent = "Add to bag", 900);
    });
  }

  // buy now
  const buy = el("buyNow");
  if(buy && qty){
    buy.addEventListener("click", ()=>{
      const q = Math.max(1, parseInt(qty.value||"1",10));
      const btnActive = document.querySelectorAll(".opt-btn.active");
      selectedOptions = {};
      btnActive.forEach(b=> selectedOptions[b.dataset.optName] = b.dataset.optValue);

      const order = [{ sku: p.sku, title: p.title, price: p.price, qty: q, selectedOptions }];
      emailCheckout(order);
    });
  }

  // checkout + copy order
  const checkout = el("checkoutEmail");
  if(checkout){ checkout.addEventListener("click", ()=> {
    const cart = getCart();
    if(!cart.length) return alert("Cart is empty.");
    emailCheckout(cart);
  });}

  const copyOrder = el("copyOrder");
  if(copyOrder){ copyOrder.addEventListener("click", async ()=>{
    const cart = getCart();
    if(!cart.length) return alert("Cart is empty.");
    const txt = orderText(cart);
    try{ await navigator.clipboard.writeText(txt); alert("Order copied to clipboard."); }
    catch(e){ window.prompt("Copy your order", txt); }
  });}

  renderCartUI();
}

if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", init); } else { init(); }
