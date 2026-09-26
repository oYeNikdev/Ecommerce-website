const CART_KEY = 'nexora_cart';
const WISHLIST_KEY = 'nexora_wishlist';
/** Reads the cart from localStorage and drops anything invalid. */
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

/** Two cart lines are "the same" if the id matches and the color matches (both null counts as a match). */
function isSameCartLine(item, productId, color) {
  return item.id === productId && (item.color || null) === (color || null);
}

function addToCart(productId, quantity = 1, color = null) {
  const cart = getCart();
  const existing = cart.find((item) => isSameCartLine(item, productId, color));
  if (existing) {
    existing.qty += quantity; // same product + same variant: increase quantity, no duplicate row
  } else {
    const newLine = { id: productId, qty: quantity };
    if (color) newLine.color = color;
    cart.push(newLine);
  }
  saveCart(cart);

  const product = PRODUCTS.find((p) => p.id === productId);
  showToast(`${product ? product.name : 'Item'} added to cart!`, 'success');
}

/** change is +1 or -1. Quantity never drops below 1 (use Remove for that). */
function updateQuantity(productId, change, color = null) {
  const cart = getCart();
  const item = cart.find((i) => isSameCartLine(i, productId, color));
  if (!item) return;
  item.qty = Math.max(1, item.qty + change);
  saveCart(cart);
}

function removeFromCart(productId, color = null) {
  const product = PRODUCTS.find((p) => p.id === productId);
  saveCart(getCart().filter((item) => !isSameCartLine(item, productId, color)));
  showToast(`${product ? product.name : 'Item'} removed from cart`);
}

/** Cart entries combined with their product details. */
function getCartItems() {
  return getCart().map((item) => ({
    ...PRODUCTS.find((p) => p.id === item.id),
    qty: item.qty,
    color: item.color || null,
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
  // Both buttons and Remove need the color too, so updates/removals hit the right line
  const colorAttr = item.color ? ` data-color="${item.color}"` : '';

  return `
    <li class="cart-item">
      <div class="cart-item__media"><img src="${item.image}" alt="" /></div>
      <div class="cart-item__info">
        <h3 class="cart-item__name">${item.name}</h3>
        ${item.color ? `<span class="cart-item__variant">Color: ${item.color}</span>` : ''}
        <span class="cart-item__price">${formatPrice(item.price)}</span>
        <div class="qty" role="group" aria-label="Quantity for ${item.name}">
          <button class="qty__btn" data-id="${item.id}"${colorAttr} data-qty-change="-1" aria-label="Decrease quantity"${item.qty <= 1 ? ' disabled' : ''}>−</button>
          <span class="qty__value" aria-live="polite">${item.qty}</span>
          <button class="qty__btn" data-id="${item.id}"${colorAttr} data-qty-change="1" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item__side">
        <span class="cart-item__subtotal">Subtotal: ${formatPrice(item.price * item.qty)}</span>
        <button class="cart-item__remove" data-remove="${item.id}"${colorAttr} aria-label="Remove ${item.name} from cart">Remove</button>
      </div>
    </li>
  `;
}

/** Draws the cart page: item list, totals, or the empty state. */
function renderCart() {
  const list = document.getElementById('cartItems');
  if (!list) return;

  const items = getCartItems();
  document.getElementById('cartLayout').hidden = items.length === 0;
  document.getElementById('cartEmpty').hidden = items.length > 0;
  if (items.length === 0) return; // no items, so no totals to show

  list.innerHTML = items.map(createCartItem).join('');
  document.getElementById('cartSummaryCount').textContent = String(getCartCount());
  document.getElementById('cartTotal').textContent = formatPrice(calculateTotal());
}

function initCartPage() {
  const list = document.getElementById('cartItems');
  if (!list) return;

  // One listener for every +, − and Remove button (they are re-created on each render)
  list.addEventListener('click', (event) => {
    const qtyBtn = event.target.closest('[data-qty-change]');
    if (qtyBtn) {
      const { id, qtyChange, color } = qtyBtn.dataset;
      updateQuantity(id, Number(qtyChange), color || null);
      // Re-rendering replaces the button, so hand keyboard focus back to the new one
      list.querySelector(`[data-id="${id}"][data-qty-change="${qtyChange}"]:not(:disabled)`)?.focus();
      return;
    }

    const removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) removeFromCart(removeBtn.dataset.remove, removeBtn.dataset.color || null);
  });

  renderCart();
}

// Keep the badge and cart page in sync when the cart changes in another tab
window.addEventListener('storage', (event) => {
  if (event.key === CART_KEY) {
    updateCartBadge();
    renderCart();
  }
});

//    WISHLIST


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

/** Adds/removes a product id from the wishlist. Returns the new state. */
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

// UI HELPERS
  

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

/**
 * Renders one product card. Pass { showDetailsLink: true } on the Browse
 * Products page to add a "Details" button next to Add to Cart — the
 * homepage's trending grid keeps its original single-button markup.
 */
function createProductCard(product, { showDetailsLink = false } = {}) {
  const category = getCategory(product.category);
  const isWishlisted = getWishlist().includes(product.id);

  const actionsHtml = showDetailsLink
    ? `
        <div class="product-card__actions">
          <a href="product-details.html?id=${product.id}" class="btn btn--secondary">Details</a>
          <button class="btn btn--primary" data-add-to-cart="${product.id}">Add to Cart</button>
        </div>
      `
    : `
        <button class="btn btn--primary btn--full product-card__add" data-add-to-cart="${product.id}">
          Add to Cart
        </button>
      `;

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
        ${actionsHtml}
      </div>
    </article>
  `;
}

/**
 * One shared click handler for any product grid: wishlist toggle + Add to
 * Cart. Used by both the homepage's trending grid and the Browse Products
 * grid, so there's only one listener implementation to maintain.
 */
function attachProductGridEvents(grid) {
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

function renderTrendingProducts() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((product) => createProductCard(product)).join('');
  attachProductGridEvents(grid);
}

// BROWSE PRODUCTS (shop.html)
// Search, category filter and sort all read/write these three variables,
// then getShopResults() applies them together so none of them resets
// the others.

let shopSearchQuery = '';
let shopCategoryFilter = 'all';
let shopSortOption = 'featured';

/** Matches on product name and category label (case-insensitive). */
function searchProducts(list, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list;

  return list.filter((product) => {
    const category = getCategory(product.category);
    return (
      product.name.toLowerCase().includes(q) ||
      (category && category.label.toLowerCase().includes(q))
    );
  });
}

function filterProductsByCategory(list, categorySlug) {
  if (categorySlug === 'all') return list;
  return list.filter((product) => product.category === categorySlug);
}

/** 'featured' returns the list as-is (original catalog order). */
function sortProducts(list, sortOption) {
  const sorted = [...list];
  switch (sortOption) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}

/** Applies category filter, then search, then sort — in that order. */
function getShopResults() {
  let results = filterProductsByCategory(PRODUCTS, shopCategoryFilter);
  results = searchProducts(results, shopSearchQuery);
  results = sortProducts(results, shopSortOption);
  return results;
}

function renderShopGrid() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  const results = getShopResults();
  const emptyState = document.getElementById('shopEmpty');
  const resultsCount = document.getElementById('shopResultsCount');

  grid.hidden = results.length === 0;
  if (emptyState) emptyState.hidden = results.length !== 0;
  if (resultsCount) {
    resultsCount.textContent =
      results.length === 0 ? '' : `${results.length} product${results.length === 1 ? '' : 's'}`;
  }

  grid.innerHTML = results.map((product) => createProductCard(product, { showDetailsLink: true })).join('');
}

function initShopPage() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return; // not on this page

  const searchInput = document.getElementById('shopSearch');
  const categorySelect = document.getElementById('shopCategory');
  const sortSelect = document.getElementById('shopSort');
  const resetBtn = document.getElementById('shopResetFilters');

  // Links like shop.html?category=audio (used on the homepage) preselect a category
  const categoryFromUrl = new URLSearchParams(window.location.search).get('category');
  if (categoryFromUrl && CATEGORIES.some((c) => c.slug === categoryFromUrl)) {
    shopCategoryFilter = categoryFromUrl;
  }

  // Category options come from CATEGORIES in data.js, so there's one source of truth
  categorySelect.innerHTML =
    '<option value="all">All Categories</option>' +
    CATEGORIES.map((c) => `<option value="${c.slug}">${c.label}</option>`).join('');
  categorySelect.value = shopCategoryFilter;

  searchInput.addEventListener('input', () => {
    shopSearchQuery = searchInput.value;
    renderShopGrid();
  });

  categorySelect.addEventListener('change', () => {
    shopCategoryFilter = categorySelect.value;
    renderShopGrid();

    // Keep the URL shareable/bookmarkable without adding a history entry per change
    const url = new URL(window.location);
    if (shopCategoryFilter === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', shopCategoryFilter);
    window.history.replaceState({}, '', url);
  });

  sortSelect.addEventListener('change', () => {
    shopSortOption = sortSelect.value;
    renderShopGrid();
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      shopSearchQuery = '';
      shopCategoryFilter = 'all';
      shopSortOption = 'featured';
      searchInput.value = '';
      categorySelect.value = 'all';
      sortSelect.value = 'featured';
      renderShopGrid();
      window.history.replaceState({}, '', window.location.pathname);
    });
  }

  attachProductGridEvents(grid);
  renderShopGrid();
}

//    PRODUCT DETAILS (product-details.html)
  

/** Home / Shop / Category / Product Name, with the current product plain text. */
function renderBreadcrumb(product) {
  const nav = document.getElementById('detailBreadcrumb');
  if (!nav) return;
  const category = getCategory(product.category);

  nav.innerHTML = `
    <a href="index.html">Home</a>
    <span class="breadcrumbs__sep">/</span>
    <a href="shop.html">Shop</a>
    ${
      category
        ? `<span class="breadcrumbs__sep">/</span><a href="shop.html?category=${category.slug}">${category.label}</a>`
        : ''
    }
    <span class="breadcrumbs__sep">/</span>
    <span class="breadcrumbs__current">${product.name}</span>
  `;
}

/** Up to 4 other products in the same category, reusing the shop's card (with its Details link). */
function renderRelatedProducts(product) {
  const container = document.getElementById('detailsRelated');
  const grid = document.getElementById('relatedGrid');
  if (!container || !grid) return;

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  if (related.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  grid.innerHTML = related.map((p) => createProductCard(p, { showDetailsLink: true })).join('');
  attachProductGridEvents(grid);
}

function initProductDetailsPage() {
  const layout = document.getElementById('detailsLayout');
  if (!layout) return; // not on this page

  const notFound = document.getElementById('detailsNotFound');
  const productId = new URLSearchParams(window.location.search).get('id');
  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) {
    layout.hidden = true;
    if (notFound) notFound.hidden = false;
    return;
  }

  layout.hidden = false;
  if (notFound) notFound.hidden = true;
  document.title = `${product.name} — NEXORA`;

  renderBreadcrumb(product);

  const category = getCategory(product.category);
  document.getElementById('detailImage').src = product.image;
  document.getElementById('detailImage').alt = product.name;
  document.getElementById('detailCategory').textContent = category ? category.label : product.category;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailRating').innerHTML =
    `${renderStars(product.rating)}<span>${product.rating} · ${product.reviews} reviews</span>`;
  document.getElementById('detailPrice').textContent = formatPrice(product.price);
  document.getElementById('detailOldPrice').textContent = formatPrice(product.oldPrice);
  document.getElementById('detailDiscount').textContent = `-${product.discount}%`;
  document.getElementById('detailDescription').textContent = product.description;

  // Color variant — a row of selectable swatches. Held in a closure variable
  // (not global state) since each page load only ever has one product.
  let selectedColor = product.colors && product.colors.length ? product.colors[0].name : null;
  const colorSection = document.getElementById('detailColorSection');
  const colorsEl = document.getElementById('detailColors');

  if (colorSection && colorsEl && product.colors && product.colors.length) {
    colorSection.hidden = false;
    colorsEl.innerHTML = product.colors
      .map(
        (c, index) => `
          <button type="button" class="color-swatch${index === 0 ? ' is-selected' : ''}" data-color="${c.name}" style="--swatch-color:${c.hex}" title="${c.name}" aria-pressed="${index === 0}">
            <span class="visually-hidden">${c.name}</span>
          </button>
        `
      )
      .join('');

    colorsEl.addEventListener('click', (event) => {
      const swatch = event.target.closest('.color-swatch');
      if (!swatch) return;
      selectedColor = swatch.dataset.color;
      colorsEl.querySelectorAll('.color-swatch').forEach((btn) => {
        const isSelected = btn === swatch;
        btn.classList.toggle('is-selected', isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });
    });
  } else if (colorSection) {
    colorSection.hidden = true;
  }

  const specsEl = document.getElementById('detailSpecs');
  if (specsEl && product.specifications) {
    specsEl.innerHTML = Object.entries(product.specifications)
      .map(([key, value]) => `<div class="details-specs__row"><dt>${key}</dt><dd>${value}</dd></div>`)
      .join('');
  }

  // Quantity selector — never below 1, same rule as the cart page
  let quantity = 1;
  const qtyValueEl = document.getElementById('detailQtyValue');
  const qtyMinusBtn = document.getElementById('detailQtyMinus');
  const qtyPlusBtn = document.getElementById('detailQtyPlus');

  function renderQuantity() {
    qtyValueEl.textContent = String(quantity);
    qtyMinusBtn.disabled = quantity <= 1;
  }
  renderQuantity();

  qtyMinusBtn.addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    renderQuantity();
  });
  qtyPlusBtn.addEventListener('click', () => {
    quantity += 1;
    renderQuantity();
  });

  // Add to Cart / Buy Now both go through the site's one existing cart system
  document.getElementById('detailAddToCart').addEventListener('click', () => {
    addToCart(product.id, quantity, selectedColor);
  });

  document.getElementById('detailBuyNow').addEventListener('click', () => {
    addToCart(product.id, quantity, selectedColor);
    // No checkout page exists yet, so Buy Now goes straight to the cart —
    // the natural next stop until a dedicated checkout flow is built.
    window.location.href = 'cart.html';
  });

  // Wishlist — the same wishlist used by the product cards, not a second one
  const wishlistBtn = document.getElementById('detailWishlistBtn');
  const wishlistLabel = document.getElementById('detailWishlistLabel');

  function renderWishlistButton() {
    const isWishlisted = getWishlist().includes(product.id);
    wishlistBtn.classList.toggle('is-active', isWishlisted);
    wishlistBtn.setAttribute('aria-pressed', String(isWishlisted));
    wishlistLabel.textContent = isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist';
  }
  renderWishlistButton();

  wishlistBtn.addEventListener('click', () => {
    toggleWishlist(product.id);
    renderWishlistButton();
  });

  // Share — native share sheet where supported, clipboard copy as the fallback
  document.getElementById('detailShareBtn').addEventListener('click', async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on NEXORA`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Shopper closed the share sheet without picking anything — nothing to do
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    } catch {
      showToast('Could not copy the link.', 'error');
    }
  });

  renderRelatedProducts(product);
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
  initShopPage();
  initProductDetailsPage();
  initNewsletterForm();
});