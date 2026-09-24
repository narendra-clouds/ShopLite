import { useEffect, useMemo, useRef, useState } from "react";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import "./App.css";

const USER_STORAGE_KEY = "shopliteUser";
const CART_STORAGE_KEY = "shopliteCart";
const WISHLIST_STORAGE_KEY = "shopliteWishlist";
const ADDRESS_STORAGE_KEY = "shopliteAddresses";

const emptyAddress = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [isLogin, setIsLogin] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const accountRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [addresses, setAddresses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ADDRESS_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [quantity, setQuantity] = useState(1);

  const [toast, setToast] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("http://localhost:8080/products");
        if (!response.ok) throw new Error("Product service unavailable");
        const data = await response.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load products. Please make sure the API Gateway and Product Service are running.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const values = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return ["All", ...values];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch = activeCategory === "All" || product.category === activeCategory;
      const text = `${product.name || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase();
      return categoryMatch && (!query || text.includes(query));
    });
  }, [products, searchTerm, activeCategory]);

  const wishlistProducts = useMemo(
    () => products.filter((product) => wishlist.includes(product.id)),
    [products, wishlist]
  );

  const cartCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const getProductIcon = (name = "") => {
    const value = name.toLowerCase();
    if (value.includes("laptop")) return "💻";
    if (value.includes("mouse")) return "🖱️";
    if (value.includes("keyboard")) return "⌨️";
    if (value.includes("phone")) return "📱";
    if (value.includes("watch")) return "⌚";
    if (value.includes("headphone")) return "🎧";
    if (value.includes("shoe")) return "👟";
    if (value.includes("bag")) return "🎒";
    if (value.includes("camera")) return "📷";
    return "🛍️";
  };

  const showToast = (message, type = "success") => setToast({ message, type });

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const addToCart = (product, amount = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      }
      return [...current, { ...product, quantity: amount }];
    });
    showToast(`${product.name} added to cart`);
  };

  const increaseQuantity = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
    showToast("Product removed from cart", "info");
  };

  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const exists = current.includes(product.id);
      showToast(
        exists ? `${product.name} removed from wishlist` : `${product.name} saved to wishlist`,
        "info"
      );
      return exists ? current.filter((id) => id !== product.id) : [...current, product.id];
    });
  };

  const handleLogin = (loggedInUser) => {
    const safeUser = {
      id: loggedInUser?.id,
      name: loggedInUser?.name || "ShopLite User",
      email: loggedInUser?.email || "",
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    setIsLogin(false);
    showToast(`Welcome, ${safeUser.name}`);
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setShowProfile(false);
    setShowOrders(false);
    showToast("You have been logged out", "info");
  };

  const openCheckout = () => {
    setOrderError("");
    if (!user) {
      setShowCart(false);
      setIsLogin(true);
      showToast("Please login to checkout", "error");
      return;
    }
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(String(addresses[0].id));
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  const updateAddressForm = (event) => {
    const { name, value } = event.target;
    setAddressForm((current) => ({ ...current, [name]: value }));
  };

  const saveAddress = () => {
    const valid = Object.values(addressForm).every((value) => String(value).trim());
    if (!valid) {
      showToast("Please complete all delivery details", "error");
      return;
    }
    const newAddress = { id: Date.now(), ...addressForm };
    setAddresses((current) => [...current, newAddress]);
    setSelectedAddressId(String(newAddress.id));
    setAddressForm(emptyAddress);
    showToast("Address saved");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Location is not supported by this browser", "error");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        setLocationLoading(false);
        showToast("Current location captured");
      },
      () => {
        setLocationLoading(false);
        showToast("Location permission was unavailable. You can enter the address manually.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectedAddress = addresses.find(
    (address) => String(address.id) === String(selectedAddressId)
  );

  const placeOrder = async () => {
    if (!user?.id) {
      setIsLogin(true);
      setShowCheckout(false);
      showToast("Please login to checkout", "error");
      return;
    }
    const deliveryAddress = selectedAddress || addressForm;
    const validAddress =
      deliveryAddress &&
      deliveryAddress.fullName &&
      deliveryAddress.phone &&
      deliveryAddress.address &&
      deliveryAddress.city &&
      deliveryAddress.state &&
      deliveryAddress.pincode;

    if (!validAddress) {
      setOrderError("Please add a complete delivery address before placing your order.");
      return;
    }

    setPlacingOrder(true);
    setOrderError("");
    try {
      const response = await fetch("http://localhost:8080/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          deliveryAddress,
          location,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to place order");
      setOrderSuccess({
        id: data.order.id,
        total: cartTotal,
        address: deliveryAddress,
        status: data.order.status || "PLACED",
      });
      setCart([]);
      setShowCheckout(false);
      setShowCart(true);
      showToast("Order placed successfully");
    } catch (err) {
      console.error(err);
      setOrderError(err.message || "Unable to place your order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const openProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const addSelectedProduct = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
  };

  if (isLogin) {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setIsLogin(false)}
      />
    );
  }

  if (showOrders) {
    return (
      <Orders
        user={user}
        onBack={() => setShowOrders(false)}
      />
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <button className="logo" type="button" onClick={() => scrollTo("home")}>
          🛍️ <span>Shop</span>Lite
        </button>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#technology">Technology</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="account-wrap" ref={accountRef}>
              <button
                className="account-button"
                type="button"
                onClick={() => setShowProfile((value) => !value)}
              >
                <span className="account-avatar">👤</span>
                <span>{user.name}</span>
                <span>⌄</span>
              </button>
              {showProfile && (
                <div className="account-menu">
                  <div className="account-menu-head">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  <button onClick={() => { setShowProfile(false); setShowProfileModal(true); }}>My Profile</button>
                  <button onClick={() => { setShowProfile(false); setShowOrders(true); }}>My Orders</button>
                  <button onClick={() => { setShowProfile(false); setShowWishlist(true); }}>Wishlist</button>
                  <button onClick={() => { setShowProfile(false); setShowAddresses(true); }}>Saved Addresses</button>
                  <button onClick={() => { setShowProfile(false); setShowSettings(true); }}>Account Settings</button>
                  <button className="logout-menu-button" onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-btn" type="button" onClick={() => setIsLogin(true)}>
              Login
            </button>
          )}
          <button className="cart-btn" type="button" onClick={() => setShowCart(true)}>
            🛒 Cart <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </nav>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="hero-badge">✨ SIMPLE • FAST • SMART</span>
            <p className="small-title">WELCOME TO SHOPLITE</p>
            <h1>Simple Shopping.<br /><span>Better Experience.</span></h1>
            <p className="hero-text">
              Discover products you love with a simple, fast and beautiful shopping experience.
            </p>
            <div className="hero-buttons">
              <button className="shop-btn" type="button" onClick={() => scrollTo("products")}>Shop Now →</button>
              <button className="explore-btn" type="button" onClick={() => scrollTo("products")}>Explore Products</button>
            </div>
            <div className="hero-stats">
              <div><strong>⚡ Fast</strong><span>Simple experience</span></div>
              <div><strong>🔒 Secure</strong><span>Protected account</span></div>
              <div><strong>🚀 Modern</strong><span>Microservices powered</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit orbit-one">💻</div>
            <div className="hero-orbit orbit-two">🎧</div>
            <div className="hero-orbit orbit-three">📱</div>
            <div className="hero-circle">🛍️</div>
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-header">
            <div>
              <p className="small-title">OUR COLLECTION</p>
              <h2>Featured Products</h2>
              <p className="section-description">
                Products are loaded live from the ShopLite Product Service through the API Gateway.
              </p>
            </div>
          </div>

          <div className="product-toolbar">
            <div className="search-box">
              <span>⌕</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />
            </div>
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="products-state">
              <div className="loader" />
              <h3>Loading products...</h3>
              <p>Connecting to ShopLite Product Service</p>
            </div>
          )}

          {!loading && error && (
            <div className="products-state error-state">
              <div className="error-icon">⚠️</div>
              <h3>Products unavailable</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="products-state">
              <div className="empty-icon">🔎</div>
              <h3>No products found</h3>
              <p>Try another search term or category.</p>
              <button className="secondary-btn" type="button" onClick={() => { setSearchTerm(""); setActiveCategory("All"); }}>
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const liked = wishlist.includes(product.id);
                const stock = Number(product.stock ?? 10);
                return (
                  <article
                    className="product-card"
                    key={product.id}
                    onClick={() => openProduct(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") openProduct(product);
                    }}
                  >
                    <div className="product-image">
                      <span className="product-badge">NEW</span>
                      <button
                        className={`wishlist-button ${liked ? "liked" : ""}`}
                        type="button"
                        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                        onClick={(event) => { event.stopPropagation(); toggleWishlist(product); }}
                      >
                        {liked ? "♥" : "♡"}
                      </button>
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span className="product-icon">{getProductIcon(product.name)}</span>
                      )}
                    </div>
                    <div className="product-info">
                      <p>{product.category || "General"}</p>
                      <h3>{product.name}</h3>
                      <div className="product-bottom">
                        <div>
                          <strong>{money(product.price)}</strong>
                          <span className={stock > 0 ? "stock-text" : "stock-text out"}>{stock > 0 ? `${stock} in stock` : "Out of stock"}</span>
                        </div>
                        <button
                          className="add-cart-btn"
                          type="button"
                          disabled={stock <= 0}
                          onClick={(event) => { event.stopPropagation(); addToCart(product); }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="technology-section" id="technology">
          <div>
            <p className="small-title">BUILT FOR LEARNING</p>
            <h2>Powered by Microservices</h2>
            <p>
              ShopLite is a hands-on Cloud & DevOps practice project built with React, Node.js,
              Express, an API Gateway and independent microservices.
            </p>
          </div>
          <div className="tech-grid">
            <span>⚛️ React</span>
            <span>🟢 Node.js</span>
            <span>🚪 API Gateway</span>
            <span>📦 Microservices</span>
          </div>
        </section>

        <section className="value-section">
          <div><strong>01</strong><span>Simple shopping flow</span></div>
          <div><strong>02</strong><span>API-driven products</span></div>
          <div><strong>03</strong><span>Cloud & DevOps ready</span></div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">🛍️ <strong>ShopLite</strong></div>
        <p>Simple Shopping. Better Experience.</p>
        <span>React • Node.js • Express • API Gateway • Microservices</span>
      </footer>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === "error" ? "!" : "✓"}</span>
          <p>{toast.message}</p>
          <button type="button" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {showCart && (
        <div className="overlay" onClick={() => setShowCart(false)}>
          <aside className="side-panel cart-panel" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">SHOPLITE</p><h2>Your Cart</h2><span>{cartCount} item{cartCount !== 1 ? "s" : ""}</span></div>
              <button className="icon-close" type="button" onClick={() => setShowCart(false)}>×</button>
            </div>
            {orderSuccess ? (
              <div className="success-content">
                <div className="success-icon">✓</div>
                <span className="success-badge">ORDER CONFIRMED</span>
                <h2>Order Placed Successfully!</h2>
                <p>Your order <strong>#{orderSuccess.id}</strong> has been placed successfully.</p>
                <div className="success-card">
                  <div><span>Order Total</span><strong>{money(orderSuccess.total)}</strong></div>
                  <div><span>Status</span><strong className="success-status">{orderSuccess.status}</strong></div>
                </div>
                <div className="address-preview">
                  <span>Delivery to</span>
                  <strong>{orderSuccess.address.fullName}</strong>
                  <p>{orderSuccess.address.address}, {orderSuccess.address.city}, {orderSuccess.address.state} - {orderSuccess.address.pincode}</p>
                </div>
                <button className="primary-btn full" type="button" onClick={() => { setShowCart(false); setOrderSuccess(null); setShowOrders(true); }}>View My Orders →</button>
                <button className="secondary-btn full" type="button" onClick={() => { setShowCart(false); setOrderSuccess(null); scrollTo("products"); }}>Continue Shopping</button>
              </div>
            ) : cart.length === 0 ? (
              <div className="empty-panel"><div className="empty-icon">🛒</div><h3>Your cart is empty</h3><p>Add products to get started.</p><button className="primary-btn" type="button" onClick={() => { setShowCart(false); scrollTo("products"); }}>Start Shopping</button></div>
            ) : (
              <div className="panel-body">
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-item-icon">{getProductIcon(item.name)}</div>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>{money(item.price)}</span>
                        <div className="quantity-controls">
                          <button type="button" onClick={() => decreaseQuantity(item.id)}>−</button>
                          <b>{item.quantity}</b>
                          <button type="button" onClick={() => increaseQuantity(item.id)}>+</button>
                        </div>
                      </div>
                      <div className="cart-item-total"><strong>{money(Number(item.price) * item.quantity)}</strong><button type="button" onClick={() => removeFromCart(item.id)}>Remove</button></div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
                  <div><span>Delivery</span><strong>FREE</strong></div>
                  <div className="grand-total"><span>Total</span><strong>{money(cartTotal)}</strong></div>
                  <button className="primary-btn full" type="button" onClick={openCheckout}>Proceed to Checkout →</button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {showCheckout && (
        <div className="overlay" onClick={() => setShowCheckout(false)}>
          <div className="checkout-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">SHOPLITE CHECKOUT</p><h2>Delivery & Order Summary</h2></div>
              <button className="icon-close" type="button" onClick={() => setShowCheckout(false)}>×</button>
            </div>
            <div className="checkout-grid">
              <div className="checkout-form">
                <h3>Delivery address</h3>
                {addresses.length > 0 && (
                  <div className="saved-address-list">
                    <p>Use a saved address</p>
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        className={String(address.id) === String(selectedAddressId) ? "saved-address selected" : "saved-address"}
                        onClick={() => setSelectedAddressId(String(address.id))}
                      >
                        <strong>{address.fullName}</strong>
                        <span>{address.address}, {address.city}, {address.state} - {address.pincode}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="form-grid">
                  {[
                    ["fullName", "Full Name", "Your full name"],
                    ["phone", "Phone", "10-digit phone number"],
                    ["address", "Address", "House / street / area"],
                    ["city", "City", "City"],
                    ["state", "State", "State"],
                    ["pincode", "PIN Code", "6-digit PIN"],
                  ].map(([name, label, placeholder]) => (
                    <label key={name} className={name === "address" ? "wide" : ""}>
                      {label}
                      <input name={name} value={addressForm[name]} onChange={updateAddressForm} placeholder={placeholder} />
                    </label>
                  ))}
                </div>
                <div className="location-row">
                  <div><strong>📍 Current location</strong><span>{location ? `${location.latitude}, ${location.longitude}` : "Optional — capture coordinates for this order"}</span></div>
                  <button className="secondary-btn" type="button" onClick={useCurrentLocation} disabled={locationLoading}>{locationLoading ? "Locating..." : "Use my location"}</button>
                </div>
                <button className="secondary-btn" type="button" onClick={saveAddress}>+ Save Address</button>
                {orderError && <div className="form-error">⚠️ {orderError}</div>}
              </div>
              <div className="checkout-summary">
                <h3>Order summary</h3>
                {cart.map((item) => (
                  <div className="summary-item" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{money(Number(item.price) * item.quantity)}</strong></div>
                ))}
                <div className="summary-total-line"><span>Total</span><strong>{money(cartTotal)}</strong></div>
                <p className="checkout-note">🔒 Your checkout details are handled by ShopLite.</p>
                <button className="primary-btn full" type="button" onClick={placeOrder} disabled={placingOrder}>{placingOrder ? "Placing Order..." : "Place Order →"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedProduct(null)}>×</button>
            <div className="detail-visual">
              {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} /> : <span>{getProductIcon(selectedProduct.name)}</span>}
            </div>
            <div className="detail-content">
              <p className="eyebrow">{selectedProduct.category || "PRODUCT"}</p>
              <h2>{selectedProduct.name}</h2>
              <strong className="detail-price">{money(selectedProduct.price)}</strong>
              <p className="detail-description">{selectedProduct.description || "A carefully selected ShopLite product for your everyday needs."}</p>
              <p className={Number(selectedProduct.stock ?? 10) > 0 ? "detail-stock" : "detail-stock out"}>{Number(selectedProduct.stock ?? 10) > 0 ? `${selectedProduct.stock ?? 10} items available` : "Out of stock"}</p>
              <div className="detail-actions">
                <div className="detail-quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button></div>
                <button className="primary-btn" type="button" disabled={Number(selectedProduct.stock ?? 10) <= 0} onClick={addSelectedProduct}>Add to Cart</button>
                <button className={`secondary-btn ${wishlist.includes(selectedProduct.id) ? "liked" : ""}`} type="button" onClick={() => toggleWishlist(selectedProduct)}>{wishlist.includes(selectedProduct.id) ? "♥ Wishlisted" : "♡ Wishlist"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="overlay" onClick={() => setShowProfileModal(false)}>
          <div className="account-modal small-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div><p className="eyebrow">SHOPLITE ACCOUNT</p><h2>My Profile</h2></div>
              <button className="icon-close" type="button" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="profile-card">
              <div className="profile-avatar">👤</div>
              <div><span>Name</span><strong>{user?.name}</strong></div>
              <div><span>Email</span><strong>{user?.email}</strong></div>
              <div><span>User ID</span><strong>{user?.id}</strong></div>
            </div>
          </div>
        </div>
      )}

      {showWishlist && (
        <div className="overlay" onClick={() => setShowWishlist(false)}>
          <div className="account-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header"><div><p className="eyebrow">SHOPLITE</p><h2>My Wishlist</h2></div><button className="icon-close" type="button" onClick={() => setShowWishlist(false)}>×</button></div>
            {wishlistProducts.length === 0 ? <div className="empty-panel"><div className="empty-icon">♡</div><h3>Your wishlist is empty</h3><p>Save products you want to revisit.</p></div> : <div className="wishlist-grid">{wishlistProducts.map((product) => <div className="wishlist-item" key={product.id}><div className="wishlist-visual">{getProductIcon(product.name)}</div><div><strong>{product.name}</strong><span>{money(product.price)}</span><button className="primary-btn" type="button" onClick={() => addToCart(product)}>Add to Cart</button></div><button className="remove-wish" type="button" onClick={() => toggleWishlist(product)}>♥</button></div>)}</div>}
          </div>
        </div>
      )}

      {showAddresses && (
        <div className="overlay" onClick={() => setShowAddresses(false)}>
          <div className="account-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header"><div><p className="eyebrow">SHOPLITE ACCOUNT</p><h2>Saved Addresses</h2></div><button className="icon-close" type="button" onClick={() => setShowAddresses(false)}>×</button></div>
            {addresses.length === 0 ? <div className="empty-panel"><div className="empty-icon">📍</div><h3>No saved addresses</h3><p>Add an address during checkout and it will appear here.</p></div> : <div className="address-list">{addresses.map((address) => <div className="address-card" key={address.id}><strong>{address.fullName}</strong><span>{address.phone}</span><p>{address.address}, {address.city}, {address.state} - {address.pincode}</p></div>)}</div>}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="account-modal small-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header"><div><p className="eyebrow">SHOPLITE ACCOUNT</p><h2>Account Settings</h2></div><button className="icon-close" type="button" onClick={() => setShowSettings(false)}>×</button></div>
            <div className="settings-card"><span>Signed in as</span><strong>{user?.email}</strong><p>Authentication is intentionally simple for this learning project. Password hashing and JWT authentication can be introduced later with a database.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
