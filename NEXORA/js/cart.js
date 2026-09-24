const CART_KEY = 'nexora_cart';
const WISHLIST_KEY = 'nexora_wishlist';
function getCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return stored.filter(
      (item) => PRODUCTS.some((p) => p.id === item.id) && Number.isInteger(item.qty) && item.qty > 0
    );
  } catch {
    return [];
  }
}

/** Saves the cart, then refreshes everything that depends on it. */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  renderCart(); // does nothing on pages without the cart section
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1; // same product: increase quantity, no duplicate row
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  saveCart(cart);

  const product = PRODUCTS.find((p) => p.id === productId);
  showToast(`${product ? product.name : 'Item'} added to cart!`, 'success');
}

function updateQuantity(productId, change) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + change);
  saveCart(cart);
}

function removeFromCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  saveCart(getCart().filter((item) => item.id !== productId));
  showToast(`${product ? product.name : 'Item'} removed from cart`);
}

function getCartItems() {
  return getCart().map((item) => ({
    ...PRODUCTS.find((p) => p.id === item.id),
    qty: item.qty,
  }));
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

function calculateTotal() {
  return getCartItems().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = String(count);
  badge.dataset.count = String(count);
}

function createCartItem(item) {
  return `
    <li class="cart-item">
      <div class="cart-item__media"><img src="${item.image}" alt="" /></div>
      <div class="cart-item__info">
        <h3 class="cart-item__name">${item.name}</h3>
        <span class="cart-item__price">${formatPrice(item.price)}</span>
        <div class="qty" role="group" aria-label="Quantity for ${item.name}">
          <button class="qty__btn" data-id="${item.id}" data-qty-change="-1" aria-label="Decrease quantity"${item.qty <= 1 ? ' disabled' : ''}>−</button>
          <span class="qty__value" aria-live="polite">${item.qty}</span>
          <button class="qty__btn" data-id="${item.id}" data-qty-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item__side">
        <span class="cart-item__subtotal">Subtotal: ${formatPrice(item.price * item.qty)}</span>
        <button class="cart-item__remove" data-remove="${item.id}" aria-label="Remove ${item.name} from cart">Remove</button>
      </div>
    </li>
  `;
}

function renderCart() {
  const list = document.getElementById('cartItems');
  if (!list) return;

  const items = getCartItems();
  document.getElementById('cartLayout').hidden = items.length === 0;
  document.getElementById('cartEmpty').hidden = items.length > 0;
  if (items.length === 0) return; 

  list.innerHTML = items.map(createCartItem).join('');
  document.getElementById('cartSummaryCount').textContent = String(getCartCount());
  document.getElementById('cartTotal').textContent = formatPrice(calculateTotal());
}

function initCartPage() {
  const list = document.getElementById('cartItems');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const qtyBtn = event.target.closest('[data-qty-change]');
    if (qtyBtn) {
      const { id, qtyChange } = qtyBtn.dataset;
      updateQuantity(id, Number(qtyChange));
      list.querySelector(`[data-id="${id}"][data-qty-change="${qtyChange}"]:not(:disabled)`)?.focus();
      return;
    }

    const removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) removeFromCart(removeBtn.dataset.remove);
  });

  renderCart();
}

window.addEventListener('storage', (event) => {
  if (event.key === CART_KEY) {
    updateCartBadge();
    renderCart();
  }
});

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistBadge();
}

function toggleWishlist(productId) {
  const list = getWishlist();
  const index = list.indexOf(productId);
  const isNowWishlisted = index === -1;

  if (isNowWishlisted) {
    list.push(productId);
  } else {
    list.splice(index, 1);
  }

  saveWishlist(list);
  return isNowWishlisted;
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistCount');
  if (!badge) return;
  const count = getWishlist().length;
  badge.textContent = String(count);
  badge.dataset.count = String(count);
}
function showToast(message, type = 'default') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = type === 'default' ? 'toast' : `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 200ms ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function renderStars(rating) {
  const filledCount = Math.round(rating);
  const emptyCount = 5 - filledCount;
  const filled = `<span class="product-card__stars">${'★'.repeat(filledCount)}</span>`;
  const empty = `<span class="text-muted">${'☆'.repeat(emptyCount)}</span>`;
  return filled + empty;
}

function renderCategories() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(
    (category) => `
      <a class="category-card animate-in" href="shop.html?category=${category.slug}">
        <img class="category-card__icon" src="${category.icon}" alt="" />
        <span class="category-card__label">${category.label}</span>
      </a>
    `
  ).join('');
}

function createProductCard(product) {
  const category = getCategory(product.category);
  const isWishlisted = getWishlist().includes(product.id);

  return `
    <article class="product-card animate-in">
      <div class="product-card__media">
        <span class="product-card__discount">-${product.discount}%</span>
        <button
          class="product-card__wishlist icon-btn${isWishlisted ? ' is-active' : ''}"
          data-wishlist-toggle="${product.id}"
          aria-label="${isWishlisted ? 'Remove' : 'Add'} ${product.name} ${isWishlisted ? 'from' : 'to'} wishlist"
          aria-pressed="${isWishlisted}"
        >
          <svg viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.3 5 5.8 5c2 0 3.3 1 4.2 2.3.5.7.7 1 2 1s1.5-.3 2-1C15 6 16.3 5 18.2 5 21.7 5 23.5 8.4 22 11.9 19.5 16.4 12 21 12 21z"/>
          </svg>
        </button>
        <img src="${product.image}" alt="" />
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${category ? category.label : product.category}</span>
        <h3 class="product-card__name">${product.name}</h3>
        <div class="product-card__rating">
          ${renderStars(product.rating)}
          <span>${product.rating} · ${product.reviews} reviews</span>
        </div>
        <div class="product-card__price-row">
          <span class="product-card__price">${formatPrice(product.price)}</span>
          <span class="product-card__old-price">${formatPrice(product.oldPrice)}</span>
        </div>
        <button class="btn btn--primary btn--full product-card__add" data-add-to-cart="${product.id}">
          Add to Cart
        </button>
      </div>
    </article>
  `;
}

function renderTrendingProducts() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map(createProductCard).join('');

  grid.addEventListener('click', (event) => {
    const wishlistBtn = event.target.closest('[data-wishlist-toggle]');
    if (wishlistBtn) {
      const id = wishlistBtn.dataset.wishlistToggle;
      const isNowWishlisted = toggleWishlist(id);
      wishlistBtn.classList.toggle('is-active', isNowWishlisted);
      wishlistBtn.setAttribute('aria-pressed', String(isNowWishlisted));
      return;
    }

    const cartBtn = event.target.closest('[data-add-to-cart]');
    if (cartBtn) {
      addToCart(cartBtn.dataset.addToCart);
    }
  });
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.addEventListener('click', (event) => {
      if (event.target.matches('.navbar__link')) {
        navLinks.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailInput = form.querySelector('input[type="email"]');

    if (emailInput && emailInput.checkValidity() && emailInput.value.trim() !== '') {
      showToast("You're subscribed! Welcome to NEXORA.", 'success');
      form.reset();
    } else {
      showToast('Please enter a valid email address.', 'error');
      emailInput?.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderCategories();
  renderTrendingProducts();
  updateCartBadge();
  updateWishlistBadge();
  initCartPage();
  initNewsletterForm();
});