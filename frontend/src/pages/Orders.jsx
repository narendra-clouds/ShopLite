import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH ORDERS + PRODUCTS
  // ==========================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get orders from Order Service through API Gateway
        const ordersResponse = await fetch(
          "http://localhost:8080/orders"
        );

        if (!ordersResponse.ok) {
          throw new Error("Failed to fetch orders");
        }

        const ordersData = await ordersResponse.json();

        // Get products from Product Service through API Gateway
        const productsResponse = await fetch(
          "http://localhost:8080/products"
        );

        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData = await productsResponse.json();

        setOrders(ordersData.orders || []);
        setProducts(productsData.products || []);

      } catch (err) {
        console.error("Orders API Error:", err);

        setError(
          "Unable to load orders. Please make sure the API Gateway, Order Service and Product Service are running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==========================================
  // FIND PRODUCT
  // ==========================================

  const getProduct = (productId) => {
    return products.find(
      (product) => product.id === productId
    );
  };

  // ==========================================
  // PRODUCT ICON
  // ==========================================

  const getProductIcon = (productId) => {
    switch (productId) {
      case 1:
        return "💻";

      case 2:
        return "🖱️";

      case 3:
        return "⌨️";

      default:
        return "🛍️";
    }
  };

  // ==========================================
  // FORMAT PRICE
  // ==========================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // CALCULATE ORDER TOTAL
  // ==========================================

  const calculateOrderTotal = (order) => {
    return order.items.reduce(
      (total, item) => {
        const product = getProduct(item.productId);

        if (!product) {
          return total;
        }

        return (
          total +
          product.price * item.quantity
        );
      },
      0
    );
  };

  // ==========================================
  // BACK TO SHOP
  // ==========================================

  const goBackToShop = () => {
    window.location.href = "/";
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="orders-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="orders-hero">

        <button
          className="back-to-shop"
          onClick={goBackToShop}
        >
          ← Back to ShopLite
        </button>

        <p className="small-title">
          SHOPLITE ACCOUNT
        </p>

        <h1>
          My Orders
        </h1>

        <p>
          Track your purchases and order status.
        </p>

      </div>


      {/* ======================================
          LOADING
      ====================================== */}

      {loading && (

        <div className="orders-state">

          <div className="loader"></div>

          <h3>
            Loading your orders...
          </h3>

          <p>
            Connecting to ShopLite services
          </p>

        </div>

      )}


      {/* ======================================
          ERROR
      ====================================== */}

      {!loading && error && (

        <div className="orders-state error-state">

          <div className="error-icon">
            ⚠️
          </div>

          <h3>
            Orders unavailable
          </h3>

          <p>
            {error}
          </p>

          <button
            className="back-to-shop"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>

        </div>

      )}


      {/* ======================================
          NO ORDERS
      ====================================== */}

      {!loading &&
        !error &&
        orders.length === 0 && (

          <div className="orders-state">

            <div className="empty-orders-icon">
              📦
            </div>

            <h3>
              No orders yet
            </h3>

            <p>
              Your placed orders will appear
              here.
            </p>

            <button
              className="shop-btn"
              onClick={goBackToShop}
            >
              Start Shopping →
            </button>

          </div>

        )}


      {/* ======================================
          ORDERS
      ====================================== */}

      {!loading &&
        !error &&
        orders.length > 0 && (

          <div className="orders-list">

            {orders
              .slice()
              .reverse()
              .map((order) => (

                <div
                  className="order-card"
                  key={order.id}
                >

                  {/* ==================================
                      HEADER
                  ================================== */}

                  <div className="order-header">

                    <div>

                      <span className="order-label">
                        ORDER
                      </span>

                      <h2>
                        #{order.id}
                      </h2>

                    </div>

                    <span className="order-status">
                      🟢 {order.status}
                    </span>

                  </div>


                  {/* ==================================
                      META
                  ================================== */}

                  <div className="order-meta">

                    <span>
                      👤 User #{order.userId}
                    </span>

                    <span>
                      📅{" "}
                      {formatDate(
                        order.createdAt
                      )}
                    </span>

                  </div>


                  {/* ==================================
                      ITEMS
                  ================================== */}

                  <div className="order-items">

                    <h3>
                      Order Items
                    </h3>

                    {order.items &&
                      order.items.map(
                        (item, index) => {

                          const product =
                            getProduct(
                              item.productId
                            );

                          return (

                            <div
                              className="order-item"
                              key={`${order.id}-${index}`}
                            >

                              {/* Product Icon */}

                              <div className="order-item-icon">

                                {getProductIcon(
                                  item.productId
                                )}

                              </div>


                              {/* Product Information */}

                              <div className="order-item-details">

                                <strong>

                                  {product
                                    ? product.name
                                    : `Product #${item.productId}`}

                                </strong>

                                <p>

                                  {product
                                    ? `${formatPrice(
                                        product.price
                                      )} × ${
                                        item.quantity
                                      }`
                                    : `Quantity: ${
                                        item.quantity
                                      }`}

                                </p>

                              </div>


                              {/* Item Total */}

                              <span className="order-item-price">

                                {product
                                  ? formatPrice(
                                      product.price *
                                        item.quantity
                                    )
                                  : "—"}

                              </span>

                            </div>

                          );
                        }
                      )}

                  </div>


                  {/* ==================================
                      ORDER TOTAL
                  ================================== */}

                  <div className="order-total">

                    <span>
                      Order Total
                    </span>

                    <strong>
                      {formatPrice(
                        calculateOrderTotal(order)
                      )}
                    </strong>

                  </div>


                  {/* ==================================
                      ORDER FOOTER
                  ================================== */}

                  <div className="order-footer">

                    <span>
                      Order Status
                    </span>

                    <strong>
                      {order.status}
                    </strong>

                  </div>

                </div>

              ))}

          </div>

        )}

    </div>
  );
}

export default Orders;