import { useEffect, useState } from "react";

const readResponseData = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch {
    return { message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `Request failed (${response.status})` };
  }
};

function Orders({ user, onBack, onReviewProduct }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [reviewedProductIds, setReviewedProductIds] = useState(() => new Set());

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
        const ordersResponse = await fetch("http://127.0.0.1:8080/orders", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("shopliteToken") || ""}` },
        });
        const ordersData = await readResponseData(ordersResponse);
        if (!ordersResponse.ok) throw new Error(ordersData.message || `Failed to load orders (HTTP ${ordersResponse.status})`);
        const loadedOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
        setOrders(loadedOrders);

        // Review history is optional for the Orders page. If Review Service is unavailable,
        // orders should still load normally.
        try {
          const reviewsResponse = await fetch("http://127.0.0.1:8080/reviews/user", {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("shopliteToken") || ""}` },
          });
          const reviewsData = await readResponseData(reviewsResponse);
          if (reviewsResponse.ok && Array.isArray(reviewsData.reviews)) {
            setReviewedProductIds(new Set(reviewsData.reviews.map((review) => Number(review.productId))));
          }
        } catch (reviewError) {
          console.warn("Unable to load review history:", reviewError.message);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load your orders. Please make sure the API Gateway and services are running.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

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

  const totalFor = (order) => Number(order.total || (order.items || []).reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0));

  const statusSteps = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
  const canCancel = (order) => ["PLACED", "CONFIRMED", "PACKED"].includes(order.status);

  const cancelOrder = async (order) => {
    const confirmed = window.confirm(`Cancel order #${order.id}? The reserved stock will be returned to inventory.`);
    if (!confirmed) return;
    try {
      setActionMessage("");
      const response = await fetch(`http://127.0.0.1:8080/orders/${order.id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionStorage.getItem("shopliteToken") || ""}` },
      });
      const data = await readResponseData(response);
      if (!response.ok) throw new Error(data.message || `Unable to cancel order (HTTP ${response.status})`);
      setOrders((current) => current.map((item) => item.id === order.id ? data.order : item));
    } catch (err) {
      setActionMessage(err.message || "Unable to cancel order");
    }
  };

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

      {!loading && !error && actionMessage && <div className="order-action-message" role="alert">⚠️ {actionMessage}</div>}

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
                  const name = item.name || `Product #${item.productId}`;
                  const price = Number(item.price || 0);
                  return (
                    <div className="order-item" key={`${order.id}-${item.productId}-${index}`}>
                      <div className="order-item-icon">{item.image ? <img src={item.image} alt="" /> : iconFor(name)}</div>
                      <div className="order-item-details">
                        <strong>{name}</strong>
                        <p>{money(price)} × {item.quantity}</p>
                        {order.status === "DELIVERED" && onReviewProduct && (
                          <button
                            className="secondary-btn order-review-btn"
                            type="button"
                            disabled={reviewedProductIds.has(Number(item.productId))}
                            onClick={() => onReviewProduct(item)}
                          >
                            {reviewedProductIds.has(Number(item.productId)) ? "✓ Reviewed" : "⭐ Write a Review"}
                          </button>
                        )}
                      </div>
                      <strong className="order-item-price">{money(item.lineTotal ?? price * item.quantity)}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="order-total"><span>Order Total</span><strong>{money(totalFor(order))}</strong></div>
              {order.deliveryAddress && <div className="order-delivery-address"><div><p className="small-title">DELIVERY ADDRESS</p><strong>{order.deliveryAddress.fullName}</strong><span>{order.deliveryAddress.address}</span><span>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</span><span>📞 {order.deliveryAddress.phone}</span></div></div>}
              <div className="order-tracking"><p className="small-title">ORDER TRACKING</p><div className="order-tracking-steps">{statusSteps.map((step, index) => { const currentIndex = statusSteps.indexOf(order.status); const active = currentIndex >= 0 && index <= currentIndex; return <div className={active ? "tracking-step active" : "tracking-step"} key={step}><span>{active ? "✓" : index + 1}</span><strong>{step}</strong></div>; })}</div>{order.status === "CANCELLED" && <div className="cancelled-note">This order has been cancelled.</div>}</div>
              <div className="order-footer"><span>Status</span><strong>{order.status}</strong></div>
              {canCancel(order) && <button className="cancel-order-btn" type="button" onClick={() => cancelOrder(order)}>Cancel Order</button>}
              {order.status === "CANCELLED" && order.cancelledAt && <div className="cancelled-meta">Cancelled on {dateFor(order.cancelledAt)}</div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
