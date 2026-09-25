import { useEffect, useMemo, useState } from "react";

function Orders({ user, onBack }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setError("Please login to view your orders.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [ordersResponse, productsResponse] = await Promise.all([
          fetch("http://localhost:8080/orders", { headers: { Authorization: `Bearer ${sessionStorage.getItem("shopliteToken") || ""}` } }),
          fetch("http://localhost:8080/products"),
        ]);

        if (!ordersResponse.ok) throw new Error("Failed to load orders");
        if (!productsResponse.ok) throw new Error("Failed to load products");

        const ordersData = await ordersResponse.json();
        const productsData = await productsResponse.json();

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load your orders. Please make sure the API Gateway and services are running.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const iconFor = (name = "") => {
    const value = name.toLowerCase();
    if (value.includes("laptop")) return "💻";
    if (value.includes("mouse")) return "🖱️";
    if (value.includes("keyboard")) return "⌨️";
    if (value.includes("phone")) return "📱";
    if (value.includes("watch")) return "⌚";
    if (value.includes("headphone")) return "🎧";
    return "🛍️";
  };

  const dateFor = (value) => {
    if (!value) return "Date unavailable";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalFor = (order) =>
    (order.items || []).reduce((total, item) => {
      const product = productMap.get(item.productId);
      return total + (product ? Number(product.price) * Number(item.quantity) : 0);
    }, 0);

  return (
    <div className="orders-page">
      <header className="orders-hero">
        <button className="back-to-shop" type="button" onClick={onBack}>← Back to ShopLite</button>
        <p className="small-title">SHOPLITE ACCOUNT</p>
        <h1>My Orders</h1>
        <p>Track your purchases and order status.</p>
      </header>

      {loading && (
        <div className="orders-state"><div className="loader" /><h3>Loading your orders...</h3><p>Connecting to ShopLite services</p></div>
      )}

      {!loading && error && (
        <div className="orders-state error-state"><div className="error-icon">⚠️</div><h3>Orders unavailable</h3><p>{error}</p><button className="primary-btn" type="button" onClick={onBack}>Back to ShopLite</button></div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-state"><div className="empty-icon">📦</div><h3>No orders yet</h3><p>Your orders will appear here after you place your first order.</p><button className="primary-btn" type="button" onClick={onBack}>Start Shopping →</button></div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="orders-list">
          {orders.slice().reverse().map((order) => (
            <article className="order-card" key={order.id}>
              <div className="order-header">
                <div><span className="order-label">ORDER</span><h2>#{order.id}</h2></div>
                <span className="order-status">● {order.status}</span>
              </div>
              <div className="order-meta"><span>📅 {dateFor(order.createdAt)}</span><span>👤 {user.name}</span></div>
              <div className="order-items">
                <h3>Order Items</h3>
                {(order.items || []).map((item, index) => {
                  const product = productMap.get(item.productId);
                  return (
                    <div className="order-item" key={`${order.id}-${item.productId}-${index}`}>
                      <div className="order-item-icon">{iconFor(product?.name)}</div>
                      <div className="order-item-details">
                        <strong>{product?.name || `Product #${item.productId}`}</strong>
                        <p>{product ? `${money(product.price)} × ${item.quantity}` : `Quantity: ${item.quantity}`}</p>
                      </div>
                      <strong className="order-item-price">{product ? money(product.price * item.quantity) : "—"}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="order-total"><span>Order Total</span><strong>{money(totalFor(order))}</strong></div>
              <div className="order-footer"><span>Status</span><strong>{order.status}</strong></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
