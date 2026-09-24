import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import "./App.css";

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  // Products
  const [products, setProducts] = useState([]);

  // Shopping cart
  const [cart, setCart] = useState([]);

  // Cart panel
  const [showCart, setShowCart] = useState(false);

  // Order
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  // API states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add-to-cart feedback
  const [addedProductId, setAddedProductId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:8080/products"
        );

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

  // ==========================================
  // ADD PRODUCT TO CART
  // ==========================================

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === product.id
      );

      // Product already exists
      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      // New product
      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    // Visual feedback
    setAddedProductId(product.id);
    setToastMessage(`${product.name} added to cart`);

    setTimeout(() => {
      setAddedProductId(null);
    }, 1200);

    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==========================================
  // REMOVE PRODUCT
  // ==========================================

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================

  const placeOrder = async () => {
    if (cart.length === 0) {
      return;
    }

    setPlacingOrder(true);
    setOrderMessage("");
    setOrderSuccess(null);

    try {
      const response = await fetch(
        "http://localhost:8080/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: 1,

            items: cart.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to place order"
        );
      }

      console.log("Order created:", data);

      // ========================================
      // SUCCESS
      // ========================================

      const createdOrderId = data.order.id;

      setOrderSuccess({
        id: createdOrderId,
      });

      setOrderMessage(
        `Your order #${createdOrderId} has been placed successfully.`
      );

      // Clear cart
      setCart([]);

    } catch (error) {
      console.error("Order API Error:", error);

      setOrderMessage(
        "Unable to place your order. Please try again."
      );

      setOrderSuccess(null);

    } finally {
      setPlacingOrder(false);
    }
  };

  // ==========================================
  // CART TOTAL QUANTITY
  // ==========================================

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ==========================================
  // CART TOTAL PRICE
  // ==========================================

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) * item.quantity,
    0
  );

  // ==========================================
  // SCROLL TO PRODUCTS
  // ==========================================

  const scrollToProducts = () => {
    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  // ==========================================
  // PRODUCT ICON
  // ==========================================

  const getProductIcon = (productName) => {
    const name = productName.toLowerCase();

    if (name.includes("laptop")) return "💻";
    if (name.includes("mouse")) return "🖱️";
    if (name.includes("keyboard")) return "⌨️";
    if (name.includes("phone")) return "📱";
    if (name.includes("watch")) return "⌚";
    if (name.includes("headphone")) return "🎧";
    if (name.includes("shoe")) return "👟";
    if (name.includes("bag")) return "🎒";

    return "🛍️";
  };

  // ==========================================
  // VIEW ORDERS
  // ==========================================

  const viewOrders = () => {
    setShowCart(false);
    setOrderSuccess(null);
    setOrderMessage("");
    setShowOrders(true);
  };

  // ==========================================
  // CONTINUE SHOPPING
  // ==========================================

  const continueShopping = () => {
    setShowCart(false);
    setOrderSuccess(null);
    setOrderMessage("");

    setTimeout(() => {
      scrollToProducts();
    }, 100);
  };

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (isLogin) {
    return <Login />;
  }

  // ==========================================
  // ORDERS PAGE
  // ==========================================

  if (showOrders) {
    return (
      <Orders
        onBack={() => setShowOrders(false)}
      />
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="app">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <nav className="navbar">

        <div
          className="logo"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          🛍️ <span>Shop</span>Lite
        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#products">
            Products
          </a>

          <button
            type="button"
            className="nav-link-button"
            onClick={() => setShowOrders(true)}
          >
            My Orders
          </button>

          <a href="#about">
            About
          </a>

        </div>

        <div className="nav-actions">

          <button
            className="login-btn"
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className="cart-btn"
            onClick={() => setShowCart(true)}
          >
            🛒 Cart

            <span className="cart-count">
              {cartCount}
            </span>
          </button>

        </div>

      </nav>

      {/* ======================================
          HERO
      ====================================== */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <div className="hero-badge">
            ✨ SIMPLE • FAST • SMART
          </div>

          <p className="small-title">
            WELCOME TO SHOPLITE
          </p>

          <h1>
            Simple Shopping.
            <br />
            <span>
              Better Experience.
            </span>
          </h1>

          <p className="hero-text">
            Discover products you love with
            a simple, fast and beautiful
            shopping experience.
          </p>

          <div className="hero-buttons">

            <button
              className="shop-btn"
              onClick={scrollToProducts}
            >
              Shop Now →
            </button>

            <button
              className="explore-btn"
              onClick={scrollToProducts}
            >
              Explore Products
            </button>

          </div>

          <div className="hero-stats">

            <div>
              <strong>
                ⚡ Fast
              </strong>

              <span>
                Simple experience
              </span>
            </div>

            <div>
              <strong>
                🔒 Secure
              </strong>

              <span>
                Protected account
              </span>
            </div>

            <div>
              <strong>
                🚀 Modern
              </strong>

              <span>
                Microservices powered
              </span>
            </div>

          </div>

        </div>

        <div className="hero-visual">

          <div className="floating-card card-one">
            💻
            <span>
              Technology
            </span>
          </div>

          <div className="floating-card card-two">
            🎧
            <span>
              Accessories
            </span>
          </div>

          <div className="floating-card card-three">
            👟
            <span>
              Fashion
            </span>
          </div>

          <div className="hero-circle">
            🛍️
          </div>

        </div>

      </section>

      {/* ======================================
          PRODUCTS
      ====================================== */}

      <section
        className="products-section"
        id="products"
      >

        <div className="section-header">

          <div>

            <p className="small-title">
              OUR COLLECTION
            </p>

            <h2>
              Featured Products
            </h2>

            <p className="section-description">
              Products loaded live from our
              Product Service through the API
              Gateway.
            </p>

          </div>

          <button
            className="view-btn"
            onClick={scrollToProducts}
          >
            View All →
          </button>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="products-state">

            <div className="loader"></div>

            <h3>
              Loading products...
            </h3>

            <p>
              Connecting to ShopLite Product
              Service
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="products-state error-state">

            <div className="error-icon">
              ⚠️
            </div>

            <h3>
              Products unavailable
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {/* PRODUCTS */}

        {!loading && !error && (
          <div className="products">

            {products.map((product) => (

              <div
                className="product-card"
                key={product.id}
              >

                <div className="product-image">

                  <span className="product-icon">
                    {getProductIcon(
                      product.name
                    )}
                  </span>

                  <span className="product-badge">
                    NEW
                  </span>

                </div>

                <div className="product-info">

                  <p>
                    {product.category}
                  </p>

                  <h3>
                    {product.name}
                  </h3>

                  <div className="product-bottom">

                    <strong>
                      ₹
                      {Number(
                        product.price
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                    <button
                      className={`add-cart-btn ${
                        addedProductId ===
                        product.id
                          ? "added"
                          : ""
                      }`}
                      onClick={() =>
                        addToCart(product)
                      }
                    >
                      {addedProductId ===
                      product.id
                        ? "✓"
                        : "+"}
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

      {/* ======================================
          TECHNOLOGY SECTION
      ====================================== */}

      <section className="tech-section">

        <div className="tech-content">

          <p className="small-title">
            BUILT FOR LEARNING
          </p>

          <h2>
            Powered by Microservices
          </h2>

          <p>
            ShopLite is a hands-on Cloud &
            DevOps practice project built
            with React, Node.js, Express,
            API Gateway and independent
            microservices.
          </p>

        </div>

        <div className="tech-services">

          <span>
            ⚛️ React
          </span>

          <span>
            🟢 Node.js
          </span>

          <span>
            🚪 API Gateway
          </span>

          <span>
            📦 Microservices
          </span>

        </div>

      </section>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer id="about">

        <div className="footer-brand">
          🛍️ <strong>ShopLite</strong>
        </div>

        <p>
          Microservices practice project •
          Built for learning
        </p>

        <div className="footer-tech">
          React • Node.js • Express •
          API Gateway
        </div>

      </footer>

      {/* ======================================
          ADD TO CART TOAST
      ====================================== */}

      {toastMessage && (

        <div className="cart-toast">

          <div className="toast-icon">
            ✓
          </div>

          <div className="toast-content">

            <strong>
              Added to cart
            </strong>

            <span>
              {toastMessage}
            </span>

          </div>

          <button
            type="button"
            onClick={() =>
              setToastMessage("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* ======================================
          CART OVERLAY
      ====================================== */}

      {showCart && (

        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >

          <div
            className="cart-panel"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================
                CART HEADER
            ================================= */}

            <div className="cart-header">

              <div>

                <h2>
                  Your Cart
                </h2>

                <p>
                  {orderSuccess
                    ? "Order confirmed"
                    : `${cartCount} item${
                        cartCount !== 1
                          ? "s"
                          : ""
                      }`}
                </p>

              </div>

              <button
                className="cart-close"
                onClick={() =>
                  setShowCart(false)
                }
              >
                ×
              </button>

            </div>

            {/* =================================
                ORDER SUCCESS
            ================================= */}

            {orderSuccess && (

              <div className="order-success">

                <div className="success-icon">
                  ✓
                </div>

                <div className="success-badge">
                  ORDER CONFIRMED
                </div>

                <h2>
                  Order Placed Successfully!
                </h2>

                <p>
                  Your order #
                  <strong>
                    {orderSuccess.id}
                  </strong>
                  {" "}has been placed successfully.
                </p>

                <div className="success-order-card">

                  <div>
                    <span>
                      Order Number
                    </span>

                    <strong>
                      #{orderSuccess.id}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong className="success-status">
                      ✓ PLACED
                    </strong>
                  </div>

                </div>

                <button
                  className="orders-success-btn"
                  onClick={viewOrders}
                >
                  View My Orders →
                </button>

                <button
                  className="continue-shopping-btn"
                  onClick={continueShopping}
                >
                  Continue Shopping
                </button>

              </div>

            )}

            {/* =================================
                EMPTY CART
            ================================= */}

            {!orderSuccess &&
              cart.length === 0 && (

                <div className="empty-cart">

                  <div className="empty-cart-icon">
                    🛒
                  </div>

                  <h3>
                    Your cart is empty
                  </h3>

                  <p>
                    Add some products to
                    get started.
                  </p>

                  <button
                    className="shop-btn"
                    onClick={() => {
                      setShowCart(false);
                      scrollToProducts();
                    }}
                  >
                    Start Shopping
                  </button>

                </div>
              )}

            {/* =================================
                CART ITEMS
            ================================= */}

            {!orderSuccess &&
              cart.length > 0 && (

                <div className="cart-content">

                  <div className="cart-items">

                    {cart.map((item) => (

                      <div
                        className="cart-item"
                        key={item.id}
                      >

                        <div className="cart-item-icon">
                          {getProductIcon(
                            item.name
                          )}
                        </div>

                        <div className="cart-item-info">

                          <h3>
                            {item.name}
                          </h3>

                          <p>
                            ₹
                            {Number(
                              item.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <div className="quantity-controls">

                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>

                        <div className="cart-item-right">

                          <strong>
                            ₹
                            {(
                              Number(
                                item.price
                              ) *
                              item.quantity
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          <button
                            className="remove-btn"
                            onClick={() =>
                              removeFromCart(
                                item.id
                              )
                            }
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    ))}

                  </div>

                  {/* =================================
                      CART SUMMARY
                  ================================= */}

                  <div className="cart-summary">

                    <div className="summary-row">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₹
                        {cartTotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    <div className="summary-row">

                      <span>
                        Delivery
                      </span>

                      <strong>
                        FREE
                      </strong>

                    </div>

                    <div className="summary-total">

                      <span>
                        Total
                      </span>

                      <strong>
                        ₹
                        {cartTotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                    {/* Error message */}

                    {orderMessage &&
                      !orderSuccess && (
                        <div className="order-message error-order-message">
                          ❌ {orderMessage}
                        </div>
                      )}

                    <button
                      className="checkout-btn"
                      onClick={placeOrder}
                      disabled={placingOrder}
                    >
                      {placingOrder
                        ? "Placing Order..."
                        : "Place Order →"}
                    </button>

                  </div>

                </div>
              )}

          </div>

        </div>
      )}

    </div>
  );
}

export default App;