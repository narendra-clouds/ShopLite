import { useEffect, useMemo, useState } from "react";

import Login from "./pages/Login";

import Orders from "./pages/Orders";

import "./App.css";



const USER_STORAGE_KEY = "shopliteUser";

const CART_STORAGE_KEY = "shopliteCart";

const WISHLIST_STORAGE_KEY = "shopliteWishlist";

const ADDRESS_STORAGE_KEY = "shopliteAddresses";



function App() {

  const [isLogin, setIsLogin] = useState(false);

  const [showOrders, setShowOrders] = useState(false);

  const [showCart, setShowCart] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);



  const [products, setProducts] = useState([]);

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



  const [user, setUser] = useState(() => {

    try {

      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null;

    } catch {

      return null;

    }

  });



  const [addresses, setAddresses] = useState(() => {

    try {

      return JSON.parse(localStorage.getItem(ADDRESS_STORAGE_KEY)) || [];

    } catch {

      return [];

    }

  });



  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [addressForm, setAddressForm] = useState({

    fullName: "",

    phone: "",

    address: "",

    city: "",

    state: "",

    pincode: "",

  });



  const [locationLoading, setLocationLoading] = useState(false);

  const [location, setLocation] = useState(null);



  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(null);

  const [orderMessage, setOrderMessage] = useState("");



  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const [addedProductId, setAddedProductId] = useState(null);

  const [toastMessage, setToastMessage] = useState("");



  const [searchTerm, setSearchTerm] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  const [selectedProduct, setSelectedProduct] = useState(null);



  // ------------------------------------------------------------

  // Persist local practice data

  // ------------------------------------------------------------



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

    const syncUser = () => {

      try {

        setUser(JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null);

      } catch {

        setUser(null);

      }

    };



    window.addEventListener("storage", syncUser);

    return () => window.removeEventListener("storage", syncUser);

  }, []);



  // ------------------------------------------------------------

  // Fetch products

  // ------------------------------------------------------------



  useEffect(() => {

    const fetchProducts = async () => {

      try {

        setLoading(true);

        setError("");



        const response = await fetch("http://localhost:8080/products");



        if (!response.ok) {

          throw new Error("Failed to fetch products");

        }



        const data = await response.json();

        setProducts(data.products || []);

      } catch (err) {

        console.error("Product API Error:", err);

        setError(

          "Unable to load products. Please make sure the API Gateway and Product Service are running."

        );

      } finally {

        setLoading(false);

      }

    };



    fetchProducts();

  }, []);



  // ------------------------------------------------------------

  // Derived product data

  // ------------------------------------------------------------



  const categories = useMemo(() => {

    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];

    return ["All", ...unique];

  }, [products]);



  const filteredProducts = useMemo(() => {

    const query = searchTerm.trim().toLowerCase();



    return products.filter((product) => {

      const matchesCategory =

        activeCategory === "All" || product.category === activeCategory;



      const matchesSearch =

        !query ||

        product.name?.toLowerCase().includes(query) ||

        product.category?.toLowerCase().includes(query);



      return matchesCategory && matchesSearch;

    });

  }, [products, searchTerm, activeCategory]);



  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);



  const cartTotal = cart.reduce(

    (total, item) => total + Number(item.price) * item.quantity,

    0

  );



  // ------------------------------------------------------------

  // Helpers

  // ------------------------------------------------------------



  const getProductIcon = (productName = "") => {

    const name = productName.toLowerCase();



    if (name.includes("laptop")) return "💻";

    if (name.includes("mouse")) return "🖱️";

    if (name.includes("keyboard")) return "⌨️";

    if (name.includes("phone")) return "📱";

    if (name.includes("watch")) return "⌚";

    if (name.includes("headphone")) return "🎧";

    if (name.includes("shoe")) return "👟";

    if (name.includes("bag")) return "🎒";

    if (name.includes("camera")) return "📷";

    return "🛍️";

  };



  const money = (value) =>

    `₹${Number(value || 0).toLocaleString("en-IN")}`;



  const showToast = (message, type = "success") => {

    setToastMessage({ text: message, type });



    window.clearTimeout(window.\_\_shopLiteToastTimer);

    window.\_\_shopLiteToastTimer = window.setTimeout(() => {

      setToastMessage("");

    }, 2600);

  };



  const scrollToProducts = () => {

    document.getElementById("products")?.scrollIntoView({

      behavior: "smooth",

    });

  };



  // ------------------------------------------------------------

  // Cart

  // ------------------------------------------------------------



  const addToCart = (product) => {

    setCart((currentCart) => {

      const existing = currentCart.find((item) => item.id === product.id);



      if (existing) {

        return currentCart.map((item) =>

          item.id === product.id

            ? { ...item, quantity: item.quantity + 1 }

            : item

        );

      }



      return [...currentCart, { ...product, quantity: 1 }];

    });



    setAddedProductId(product.id);

    showToast(`${product.name} added to your cart`);



    window.setTimeout(() => setAddedProductId(null), 1000);

  };



  const increaseQuantity = (productId) => {

    setCart((currentCart) =>

      currentCart.map((item) =>

        item.id === productId

          ? { ...item, quantity: item.quantity + 1 }

          : item

      )

    );

  };



  const decreaseQuantity = (productId) => {

    setCart((currentCart) =>

      currentCart

        .map((item) =>

          item.id === productId

            ? { ...item, quantity: item.quantity - 1 }

            : item

        )

        .filter((item) => item.quantity > 0)

    );

  };



  const removeFromCart = (productId) => {

    const item = cart.find((product) => product.id === productId);

    setCart((currentCart) =>

      currentCart.filter((product) => product.id !== productId)

    );



    if (item) showToast(`${item.name} removed from cart`, "info");

  };



  // ------------------------------------------------------------

  // Wishlist

  // ------------------------------------------------------------



  const toggleWishlist = (product) => {

    const exists = wishlist.includes(product.id);



    setWishlist((current) =>

      exists

        ? current.filter((id) => id !== product.id)

        : [...current, product.id]

    );



    showToast(

      exists

        ? `${product.name} removed from wishlist`

        : `${product.name} saved to wishlist`,

      "info"

    );

  };



  // ------------------------------------------------------------

  // User / Profile

  // ------------------------------------------------------------



  const openAccount = () => {

    setShowProfile((value) => !value);

  };



  const logout = () => {

    localStorage.removeItem(USER_STORAGE_KEY);

    setUser(null);

    setShowProfile(false);

    showToast("You have been logged out", "info");

  };



  const openLogin = () => {

    setShowProfile(false);

    setIsLogin(true);

  };



  // ------------------------------------------------------------

  // Address / checkout

  // ------------------------------------------------------------



  const updateAddressForm = (event) => {

    const { name, value } = event.target;

    setAddressForm((current) => ({ ...current, [name]: value }));

  };



  const saveAddress = () => {

    const required = Object.values(addressForm).every(

      (value) => String(value).trim() !== ""

    );



    if (!required) {

      showToast("Please complete all delivery details", "error");

      return;

    }



    const newAddress = {

      id: Date.now(),

      ...addressForm,

      location,

    };



    setAddresses((current) => [...current, newAddress]);

    setSelectedAddressId(String(newAddress.id));

    setAddressForm({

      fullName: "",

      phone: "",

      address: "",

      city: "",

      state: "",

      pincode: "",

    });



    showToast("Delivery address saved");

  };



  const useCurrentLocation = () => {

    if (!navigator.geolocation) {

      showToast("Your browser does not support location", "error");

      return;

    }



    setLocationLoading(true);



    navigator.geolocation.getCurrentPosition(

      (position) => {

        const coords = {

          latitude: Number(position.coords.latitude.toFixed(6)),

          longitude: Number(position.coords.longitude.toFixed(6)),

        };



        setLocation(coords);

        setLocationLoading(false);

        showToast("Current location captured");

      },

      () => {

        setLocationLoading(false);

        showToast(

          "Location permission was not available. You can enter the address manually.",

          "error"

        );

      },

      { enableHighAccuracy: true, timeout: 10000 }

    );

  };



  const selectedAddress = addresses.find(

    (address) => String(address.id) === String(selectedAddressId)

  );



  const openCheckout = () => {

    setOrderMessage("");



    if (!user) {

      showToast("Please login before placing an order", "error");

      setShowCart(false);

      setIsLogin(true);

      return;

    }



    if (cart.length === 0) {

      showToast("Your cart is empty", "error");

      return;

    }



    if (addresses.length > 0 && !selectedAddressId) {

      setSelectedAddressId(String(addresses[0].id));

    }



    setShowCheckout(true);

  };



  // ------------------------------------------------------------

  // Place order

  // ------------------------------------------------------------



  const placeOrder = async () => {

    const deliveryAddress = selectedAddress || addressForm;



    const hasAddress =

      deliveryAddress &&

      deliveryAddress.fullName &&

      deliveryAddress.phone &&

      deliveryAddress.address &&

      deliveryAddress.city &&

      deliveryAddress.state &&

      deliveryAddress.pincode;



    if (!hasAddress) {

      showToast("Please add a delivery address before ordering", "error");

      return;

    }



    if (!user) {

      showToast("Please login before placing an order", "error");

      return;

    }



    setPlacingOrder(true);

    setOrderMessage("");



    try {

      const response = await fetch("http://localhost:8080/orders", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          userId: user.id || 1,

          items: cart.map((item) => ({

            productId: item.id,

            quantity: item.quantity,

          })),

          deliveryAddress,

          location,

        }),

      });



      const data = await response.json();



      if (!response.ok) {

        throw new Error(data.message || "Failed to place order");

      }



      const createdOrderId = data.order?.id ?? data.id ?? "UNKNOWN";



      setOrderSuccess({

        id: createdOrderId,

        address: deliveryAddress,

      });



      setOrderMessage(

        `Your order #${createdOrderId} has been placed successfully.`

      );

      setCart([]);

      setShowCheckout(false);



      showToast(`Order #${createdOrderId} placed successfully`);

    } catch (err) {

      console.error("Order API Error:", err);

      setOrderMessage(err.message || "Unable to place your order.");

    } finally {

      setPlacingOrder(false);

    }

  };



  // ------------------------------------------------------------

  // Navigation

  // ------------------------------------------------------------



  const viewOrders = () => {

    setShowCart(false);

    setShowCheckout(false);

    setOrderSuccess(null);

    setShowOrders(true);

  };



  const continueShopping = () => {

    setShowCart(false);

    setShowCheckout(false);

    setOrderSuccess(null);



    window.setTimeout(scrollToProducts, 100);

  };



  // ------------------------------------------------------------

  // Login page

  // ------------------------------------------------------------



  if (isLogin) {

    return (

      <Login

        onBack={() => {

          setIsLogin(false);

          try {

            setUser(JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || null);

          } catch {

            setUser(null);

          }

        }}

      />

    );

  }



  if (showOrders) {

    return <Orders onBack={() => setShowOrders(false)} />;

  }



  return (

    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <button

          className="logo logo-button"

          type="button"

          onClick={() =>

            window.scrollTo({ top: 0, behavior: "smooth" })

          }

        >

          🛍️ <span>Shop</span>Lite

        </button>



        <div className="nav-links">

          <a href="#home">Home</a>

          <a href="#products">Products</a>



          <button

            type="button"

            className="nav-link-button"

            onClick={viewOrders}

          >

            My Orders

          </button>



          <a href="#about">About</a>

        </div>



        <div className="nav-actions">

          {user ? (

            <div className="account-wrap">

              <button

                type="button"

                className="account-btn"

                onClick={openAccount}

              >

                <span className="account-avatar">

                  {(user.name || "U").charAt(0).toUpperCase()}

                </span>

                <span className="account-name">

                  {user.name || "Account"}

                </span>

                <span className="account-chevron">

                  {showProfile ? "⌃" : "⌄"}

                </span>

              </button>



              {showProfile && (

                <div className="profile-menu">

                  <div className="profile-menu-head">

                    <div className="profile-avatar-large">

                      {(user.name || "U").charAt(0).toUpperCase()}

                    </div>

                    <div>

                      <strong>{user.name || "ShopLite User"}</strong>

                      <span>{user.email || "Signed in"}</span>

                    </div>

                  </div>



                  <div className="profile-divider" />



                  <button type="button" onClick={viewOrders}>

                    📦 <span>My Orders</span>

                  </button>



                  <button

                    type="button"

                    onClick={() => {

                      setShowProfile(false);

                      setShowCheckout(true);

                    }}

                  >

                    📍 <span>Saved Addresses</span>

                  </button>



                  <button

                    type="button"

                    onClick={() => {

                      setShowProfile(false);

                      setActiveCategory("All");

                      setSearchTerm("");

                      scrollToProducts();

                    }}

                  >

                    ❤️ <span>My Wishlist ({wishlist.length})</span>

                  </button>



                  <div className="profile-divider" />



                  <button

                    type="button"

                    className="logout-menu-btn"

                    onClick={logout}

                  >

                    ↪ <span>Logout</span>

                  </button>

                </div>

              )}

            </div>

          ) : (

            <button

              type="button"

              className="login-btn"

              onClick={openLogin}

            >

              Login

            </button>

          )}



          <button

            type="button"

            className="cart-btn"

            onClick={() => setShowCart(true)}

          >

            🛒 Cart

            <span className="cart-count">{cartCount}</span>

          </button>

        </div>

      </nav>



      {/* HERO */}

      <section className="hero" id="home">

        <div className="hero-content">

          <div className="hero-badge">✨ SIMPLE • FAST • SMART</div>



          <p className="small-title">WELCOME TO SHOPLITE</p>



          <h1>

            Simple Shopping.

            <br />

            <span>Better Experience.</span>

          </h1>



          <p className="hero-text">

            Discover products you love with a simple, fast and beautiful

            shopping experience powered by microservices.

          </p>



          <div className="hero-buttons">

            <button type="button" className="shop-btn" onClick={scrollToProducts}>

              Shop Now →

            </button>



            <button

              type="button"

              className="explore-btn"

              onClick={() => setShowCart(true)}

            >

              🛒 View Cart

            </button>

          </div>



          <div className="hero-stats">

            <div>

              <strong>⚡ Fast</strong>

              <span>Simple experience</span>

            </div>

            <div>

              <strong>🔒 Secure</strong>

              <span>Protected account</span>

            </div>

            <div>

              <strong>🚀 Modern</strong>

              <span>Microservices powered</span>

            </div>

          </div>

        </div>



        <div className="hero-visual">

          <div className="hero-orbit orbit-one" />

          <div className="hero-orbit orbit-two" />



          <div className="floating-card card-one">

            💻 <span>Technology</span>

          </div>



          <div className="floating-card card-two">

            🎧 <span>Accessories</span>

          </div>



          <div className="floating-card card-three">

            👟 <span>Fashion</span>

          </div>



          <div className="hero-circle">🛍️</div>

        </div>

      </section>



      {/* PRODUCT SECTION */}

      <section className="products-section" id="products">

        <div className="section-heading-row">

          <div>

            <p className="small-title">OUR COLLECTION</p>

            <h2>Featured Products</h2>

            <p className="section-description">

              Live products from Product Service through the API Gateway.

            </p>

          </div>



          <div className="wishlist-summary">

            ❤️ {wishlist.length} saved

          </div>

        </div>



        {!loading && !error && products.length > 0 && (

          <div className="shop-toolbar">

            <div className="search-box">

              <span>⌕</span>

              <input

                type="search"

                placeholder="Search products..."

                value={searchTerm}

                onChange={(event) => setSearchTerm(event.target.value)}

              />

              {searchTerm && (

                <button

                  type="button"

                  onClick={() => setSearchTerm("")}

                  aria-label="Clear search"

                >

                  ×

                </button>

              )}

            </div>



            <div className="category-tabs">

              {categories.map((category) => (

                <button

                  type="button"

                  key={category}

                  className={activeCategory === category ? "active" : ""}

                  onClick={() => setActiveCategory(category)}

                >

                  {category}

                </button>

              ))}

            </div>

          </div>

        )}



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

          <div className="no-products">

            <div>🔎</div>

            <h3>No products found</h3>

            <p>Try another search or category.</p>

            <button

              type="button"

              className="secondary-btn"

              onClick={() => {

                setSearchTerm("");

                setActiveCategory("All");

              }}

            >

              Clear Filters

            </button>

          </div>

        )}



        {!loading && !error && filteredProducts.length > 0 && (

          <div className="products">

            {filteredProducts.map((product) => {

              const isSaved = wishlist.includes(product.id);

              const isAdded = addedProductId === product.id;



              return (

                <article
                  className="product-card"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProduct(product);
                    }
                  }}
                >

                  <div className="product-image">

                    <span className="product-badge">NEW</span>



                    <button

                      type="button"

                      className={`wishlist-btn ${isSaved ? "saved" : ""}`}

                      onClick={() => toggleWishlist(product)}

                      aria-label="Toggle wishlist"

                    >

                      {isSaved ? "♥" : "♡"}

                    </button>



                    <button

                      type="button"

                      className="product-visual-button"

                      onClick={() => setSelectedProduct(product)}

                      aria-label={`View ${product.name}`}

                    >

                      <span className="product-icon">

                        {getProductIcon(product.name)}

                      </span>

                    </button>

                  </div>



                  <div className="product-info">

                    <p>{product.category}</p>



                    <button

                      type="button"

                      className="product-name-button"

                      onClick={() => setSelectedProduct(product)}

                    >

                      {product.name}

                    </button>



                    <div className="product-bottom">

                      <strong>{money(product.price)}</strong>



                      <button

                        type="button"

                        className={`add-cart-btn ${isAdded ? "added" : ""}`}

                        onClick={() => addToCart(product)}

                      >

                        {isAdded ? "✓" : "+"}

                      </button>

                    </div>

                  </div>

                </article>

              );

            })}

          </div>

        )}

      </section>



      {/* VALUE STRIP */}

      <section className="value-strip">

        <div>

          <span>🚚</span>

          <strong>Free Delivery</strong>

          <small>On every order</small>

        </div>

        <div>

          <span>🔐</span>

          <strong>Secure Account</strong>

          <small>Your data stays protected</small>

        </div>

        <div>

          <span>↩️</span>

          <strong>Easy Support</strong>

          <small>Simple order management</small>

        </div>

        <div>

          <span>⚙️</span>

          <strong>Cloud Ready</strong>

          <small>Built for DevOps practice</small>

        </div>

      </section>



      {/* TECHNOLOGY */}

      <section className="tech-section">

        <div className="tech-content">

          <p className="small-title">BUILT FOR LEARNING</p>

          <h2>Powered by Microservices</h2>

          <p>

            ShopLite is a hands-on Cloud & DevOps practice project built with

            React, Node.js, Express, API Gateway and independent services.

          </p>

        </div>



        <div className="tech-services">

          <span>⚛️ React</span>

          <span>🟢 Node.js</span>

          <span>🚪 API Gateway</span>

          <span>📦 Microservices</span>

          <span>🐳 Docker</span>

          <span>☸️ Kubernetes</span>

        </div>

      </section>



      {/* FOOTER */}

      <footer id="about">

        <div>

          <div className="footer-brand">🛍️ <strong>ShopLite</strong></div>

          <p>Microservices practice project • Built for learning</p>

        </div>



        <div className="footer-tech">

          React • Node.js • Express • API Gateway • Docker • Kubernetes

        </div>

      </footer>



      {/* PRODUCT DETAILS MODAL */}

      {selectedProduct && (

        <div

          className="modal-backdrop"

          onClick={() => setSelectedProduct(null)}

        >

          <div

            className="product-modal"

            onClick={(event) => event.stopPropagation()}

          >

            <button

              type="button"

              className="modal-close"

              onClick={() => setSelectedProduct(null)}

            >

              ×

            </button>



            <div className="modal-product-icon">

              {getProductIcon(selectedProduct.name)}

            </div>



            <p className="small-title">{selectedProduct.category}</p>

            <h2>{selectedProduct.name}</h2>

            <div className="modal-price">{money(selectedProduct.price)}</div>



            <p className="modal-description">

              A featured ShopLite product. Product information is loaded from

              the Product Service, so you can add new products later without

              changing this frontend.

            </p>



            <div className="modal-actions">

              <button

                type="button"

                className="secondary-btn"

                onClick={() => toggleWishlist(selectedProduct)}

              >

                {wishlist.includes(selectedProduct.id)

                  ? "♥ Saved"

                  : "♡ Wishlist"}

              </button>



              <button

                type="button"

                className="shop-btn"

                onClick={() => {

                  addToCart(selectedProduct);

                  setSelectedProduct(null);

                }}

              >

                Add to Cart →

              </button>

            </div>

          </div>

        </div>

      )}



      {/* TOAST */}

      {toastMessage && (

        <div className={`cart-toast ${toastMessage.type || "success"}`}>

          <div className="toast-icon">

            {toastMessage.type === "error" ? "!" : toastMessage.type === "info" ? "i" : "✓"}

          </div>

          <div className="toast-content">

            <strong>

              {toastMessage.type === "error"

                ? "Action needed"

                : toastMessage.type === "info"

                ? "ShopLite"

                : "Success"}

            </strong>

            <span>{toastMessage.text}</span>

          </div>

          <button type="button" onClick={() => setToastMessage("")}>×</button>

        </div>

      )}



      {/* CART */}

      {showCart && (

        <div className="cart-overlay" onClick={() => setShowCart(false)}>

          <aside

            className="cart-panel"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="cart-header">

              <div>

                <div className="cart-kicker">SHOPLITE BAG</div>

                <h2>Your Cart</h2>

                <p>{cartCount} item{cartCount !== 1 ? "s" : ""}</p>

              </div>



              <button

                type="button"

                className="cart-close"

                onClick={() => setShowCart(false)}

              >

                ×

              </button>

            </div>



            {orderSuccess ? (

              <div className="order-success">

                <div className="success-icon">✓</div>

                <div className="success-badge">ORDER CONFIRMED</div>



                <h2>Order Placed Successfully!</h2>



                <p>

                  Your order <strong>#{orderSuccess.id}</strong> has been

                  placed successfully.

                </p>



                <div className="success-order-card">

                  <div>

                    <span>Order Number</span>

                    <strong>#{orderSuccess.id}</strong>

                  </div>

                  <div>

                    <span>Status</span>

                    <strong className="success-status">✓ PLACED</strong>

                  </div>

                </div>



                <button

                  type="button"

                  className="orders-success-btn"

                  onClick={viewOrders}

                >

                  View My Orders →

                </button>



                <button

                  type="button"

                  className="continue-shopping-btn"

                  onClick={continueShopping}

                >

                  Continue Shopping

                </button>

              </div>

            ) : cart.length === 0 ? (

              <div className="empty-cart">

                <div className="empty-cart-icon">🛒</div>

                <h3>Your cart is empty</h3>

                <p>Add some products to get started.</p>

                <button

                  type="button"

                  className="shop-btn"

                  onClick={() => {

                    setShowCart(false);

                    scrollToProducts();

                  }}

                >

                  Start Shopping

                </button>

              </div>

            ) : (

              <div className="cart-content">

                <div className="cart-items">

                  {cart.map((item) => (

                    <div className="cart-item" key={item.id}>

                      <div className="cart-item-icon">

                        {getProductIcon(item.name)}

                      </div>



                      <div className="cart-item-info">

                        <h3>{item.name}</h3>

                        <p>{money(item.price)}</p>



                        <div className="quantity-controls">

                          <button

                            type="button"

                            onClick={() => decreaseQuantity(item.id)}

                          >

                            −

                          </button>

                          <span>{item.quantity}</span>

                          <button

                            type="button"

                            onClick={() => increaseQuantity(item.id)}

                          >

                            +

                          </button>

                        </div>

                      </div>



                      <div className="cart-item-right">

                        <strong>

                          {money(Number(item.price) * item.quantity)}

                        </strong>



                        <button

                          type="button"

                          className="remove-btn"

                          onClick={() => removeFromCart(item.id)}

                        >

                          Remove

                        </button>

                      </div>

                    </div>

                  ))}

                </div>



                <div className="cart-summary">

                  <div className="summary-row">

                    <span>Subtotal</span>

                    <strong>{money(cartTotal)}</strong>

                  </div>



                  <div className="summary-row">

                    <span>Delivery</span>

                    <strong>FREE</strong>

                  </div>



                  <div className="summary-total">

                    <span>Total</span>

                    <strong>{money(cartTotal)}</strong>

                  </div>



                  {orderMessage && (

                    <div className="order-message error-order-message">

                      ❌ {orderMessage}

                    </div>

                  )}



                  <button

                    type="button"

                    className="checkout-btn"

                    onClick={openCheckout}

                  >

                    {user ? "Continue to Checkout →" : "Login to Checkout →"}

                  </button>

                </div>

              </div>

            )}

          </aside>

        </div>

      )}



      {/* CHECKOUT */}

      {showCheckout && (

        <div className="modal-backdrop" onClick={() => setShowCheckout(false)}>

          <div

            className="checkout-modal"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="checkout-head">

              <div>

                <div className="cart-kicker">SECURE CHECKOUT</div>

                <h2>Delivery Details</h2>

                <p>Where should we deliver your order?</p>

              </div>



              <button

                type="button"

                className="modal-close"

                onClick={() => setShowCheckout(false)}

              >

                ×

              </button>

            </div>



            {addresses.length > 0 && (

              <div className="saved-addresses">

                <div className="form-section-title">

                  Saved addresses

                </div>



                {addresses.map((address) => (

                  <button

                    type="button"

                    key={address.id}

                    className={`saved-address-card ${

                      String(selectedAddressId) === String(address.id)

                        ? "selected"

                        : ""

                    }`}

                    onClick={() => setSelectedAddressId(String(address.id))}

                  >

                    <span className="saved-address-radio">

                      {String(selectedAddressId) === String(address.id)

                        ? "✓"

                        : ""}

                    </span>

                    <span>

                      <strong>{address.fullName}</strong>

                      <small>

                        {address.address}, {address.city}, {address.state} -{" "}

                        {address.pincode}

                      </small>

                    </span>

                  </button>

                ))}

              </div>

            )}



            <div className="checkout-grid">

              <div className="checkout-form">

                <div className="form-section-title">Add new address</div>



                <div className="form-grid">

                  <label>

                    Full name

                    <input

                      name="fullName"

                      value={addressForm.fullName}

                      onChange={updateAddressForm}

                      placeholder="Narendra Deshmukh"

                    />

                  </label>



                  <label>

                    Mobile number

                    <input

                      name="phone"

                      value={addressForm.phone}

                      onChange={updateAddressForm}

                      placeholder="10 digit mobile number"

                    />

                  </label>



                  <label className="full-width">

                    Address

                    <textarea

                      name="address"

                      value={addressForm.address}

                      onChange={updateAddressForm}

                      placeholder="House / street / area"

                      rows="3"

                    />

                  </label>



                  <label>

                    City

                    <input

                      name="city"

                      value={addressForm.city}

                      onChange={updateAddressForm}

                      placeholder="Nanded"

                    />

                  </label>



                  <label>

                    State

                    <input

                      name="state"

                      value={addressForm.state}

                      onChange={updateAddressForm}

                      placeholder="Maharashtra"

                    />

                  </label>



                  <label>

                    PIN code

                    <input

                      name="pincode"

                      value={addressForm.pincode}

                      onChange={updateAddressForm}

                      placeholder="431601"

                    />

                  </label>

                </div>



                <div className="location-box">

                  <div>

                    <strong>📍 Delivery location</strong>

                    <span>

                      {location

                        ? `${location.latitude}, ${location.longitude}`

                        : "Optional — capture your current coordinates"}

                    </span>

                  </div>



                  <button

                    type="button"

                    className="location-btn"

                    onClick={useCurrentLocation}

                    disabled={locationLoading}

                  >

                    {locationLoading ? "Locating..." : "Use my location"}

                  </button>

                </div>



                <button

                  type="button"

                  className="save-address-btn"

                  onClick={saveAddress}

                >

                  + Save Address

                </button>

              </div>



              <div className="checkout-summary">

                <div className="form-section-title">Order summary</div>



                {cart.map((item) => (

                  <div className="checkout-item" key={item.id}>

                    <span>

                      {item.name} × {item.quantity}

                    </span>

                    <strong>

                      {money(Number(item.price) * item.quantity)}

                    </strong>

                  </div>

                ))}



                <div className="checkout-total">

                  <span>Total</span>

                  <strong>{money(cartTotal)}</strong>

                </div>



                <div className="checkout-security">

                  🔒 Your checkout details are handled by ShopLite.

                </div>



                <button

                  type="button"

                  className="place-order-btn"

                  onClick={placeOrder}

                  disabled={placingOrder}

                >

                  {placingOrder ? "Placing Order..." : "Place Order →"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



export default App;
