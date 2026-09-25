import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:8080";
const TOKEN_KEY = "shopliteToken";

const emptyProduct = {
  name: "",
  price: "",
  category: "Electronics",
  description: "",
  stock: "",
  image: "",
};

function Admin({ user, onBack }) {
  const [section, setSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = sessionStorage.getItem(TOKEN_KEY) || "";
  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const request = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [productData, userData, orderData] = await Promise.all([
        request("/admin/products"),
        request("/users"),
        request("/orders"),
      ]);
      setProducts(productData.products || []);
      setUsers(userData.users || []);
      setOrders(orderData.orders || []);
    } catch (err) {
      setError(err.message || "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const lowStock = products.filter((product) => product.status !== "INACTIVE" && Number(product.stock) <= 5);

  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyProduct);
    setEditingId(null);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      await request(editingId ? `/admin/products/${editingId}` : "/admin/products", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setNotice(editingId ? "Product updated successfully" : "Product added successfully");
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setSection("products");
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      description: product.description || "",
      stock: String(product.stock),
      image: product.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deactivateProduct = async (product) => {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;
    try {
      await request(`/admin/products/${product.id}`, { method: "DELETE" });
      setNotice(`${product.name} was deactivated`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateOrderStatus = async (order, status) => {
    try {
      await request(`/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(`Order #${order.id} updated to ${status}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <button className="logo admin-logo" type="button" onClick={onBack}>🛍️ <span>Shop</span>Lite <small>ADMIN</small></button>
        <div className="admin-top-actions">
          <span>Signed in as <strong>{user?.name}</strong></span>
          <button type="button" className="admin-back" onClick={onBack}>← Store</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="admin-nav-label">MANAGEMENT</p>
          {[
            ["dashboard", "▦", "Dashboard"],
            ["products", "▣", "Products"],
            ["orders", "◫", "Orders"],
            ["users", "♙", "Users"],
            ["inventory", "◈", "Inventory"],
          ].map(([id, icon, label]) => (
            <button key={id} type="button" className={section === id ? "active" : ""} onClick={() => setSection(id)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </aside>

        <main className="admin-content">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">SHOPLITE CONTROL CENTER</p>
              <h1>{section === "dashboard" ? "Dashboard" : section[0].toUpperCase() + section.slice(1)}</h1>
              <p>Manage the store through ShopLite backend services.</p>
            </div>
            <button className="secondary-btn" type="button" onClick={loadAll}>↻ Refresh</button>
          </div>

          {error && <div className="admin-alert error">⚠️ {error}</div>}
          {notice && <div className="admin-alert success">✓ {notice}</div>}
          {loading ? <div className="admin-loading"><div className="loader" /><h3>Loading admin data...</h3></div> : (
            <>
              {section === "dashboard" && (
                <div className="admin-dashboard">
                  <div className="admin-stat-grid">
                    <div className="admin-stat"><span>Total Users</span><strong>{users.length}</strong><small>Registered accounts</small></div>
                    <div className="admin-stat"><span>Total Products</span><strong>{products.filter((p) => p.status !== "INACTIVE").length}</strong><small>Active catalog items</small></div>
                    <div className="admin-stat"><span>Total Orders</span><strong>{orders.length}</strong><small>All customer orders</small></div>
                    <div className="admin-stat warning"><span>Low Stock</span><strong>{lowStock.length}</strong><small>5 or fewer remaining</small></div>
                  </div>
                  <div className="admin-panels-grid">
                    <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">CATALOG</p><h2>Recent Products</h2></div><button type="button" onClick={() => setSection("products")}>Manage →</button></div>{products.slice(0, 5).map((product) => <div className="admin-row" key={product.id}><span>{product.name}</span><strong>{money(product.price)}</strong><em className={product.stock <= 5 ? "low" : ""}>{product.stock} stock</em></div>)}</section>
                    <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">ORDERS</p><h2>Latest Orders</h2></div><button type="button" onClick={() => setSection("orders")}>Manage →</button></div>{orders.slice().reverse().slice(0, 5).map((order) => <div className="admin-row" key={order.id}><span>Order #{order.id}<small>User {order.userId}</small></span><strong>{order.status}</strong><em>{order.items?.length || 0} item(s)</em></div>)}</section>
                  </div>
                </div>
              )}

              {section === "products" && (
                <div className="admin-section-grid">
                  <section className="admin-panel admin-form-panel">
                    <div className="admin-panel-title"><div><p className="eyebrow">PRODUCT SERVICE</p><h2>{editingId ? "Edit Product" : "Add Product"}</h2></div>{editingId && <button type="button" onClick={resetForm}>Cancel</button>}</div>
                    <form className="admin-product-form" onSubmit={saveProduct}>
                      <label>Product Name<input name="name" value={form.name} onChange={updateForm} placeholder="Wireless Headphones" required /></label>
                      <div className="admin-form-two"><label>Price<input name="price" type="number" min="0" value={form.price} onChange={updateForm} placeholder="2499" required /></label><label>Stock<input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateForm} placeholder="50" required /></label></div>
                      <label>Category<input name="category" value={form.category} onChange={updateForm} placeholder="Electronics" required /></label>
                      <label>Description<textarea name="description" value={form.description} onChange={updateForm} placeholder="Product description" rows="4" /></label>
                      <label>Image URL <span>(optional)</span><input name="image" value={form.image} onChange={updateForm} placeholder="https://..." /></label>
                      <button className="primary-btn full" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}</button>
                    </form>
                  </section>
                  <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">CATALOG</p><h2>Products</h2></div><span>{products.length} total</span></div><div className="admin-product-list">{products.map((product) => <article className={`admin-product-card ${product.status === "INACTIVE" ? "inactive" : ""}`} key={product.id}><div className="admin-product-visual">{product.image ? <img src={product.image} alt="" /> : "🛍️"}</div><div className="admin-product-info"><div><strong>{product.name}</strong><span>{product.category}</span></div><div><b>{money(product.price)}</b><em className={product.stock <= 5 ? "low" : ""}>{product.stock} in stock</em></div></div><div className="admin-product-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button>{product.status !== "INACTIVE" && <button className="danger-text" type="button" onClick={() => deactivateProduct(product)}>Deactivate</button>}</div></article>)}</div></section>
                </div>
              )}

              {section === "users" && (
                <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">USER SERVICE</p><h2>Registered Users</h2></div><span>{users.length} accounts</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Orders</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>#{item.id}</td><td><strong>{item.name}</strong></td><td>{item.email}</td><td><span className="role-badge">{item.role}</span></td><td>{item.status}</td><td>{orders.filter((order) => String(order.userId) === String(item.id)).length}</td></tr>)}</tbody></table></div></section>
              )}

              {section === "orders" && (
                <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">ORDER SERVICE</p><h2>Customer Orders</h2></div><span>{orders.length} orders</span></div><div className="admin-orders-list">{orders.slice().reverse().map((order) => <article className="admin-order-card" key={order.id}><div><strong>Order #{order.id}</strong><span>User ID {order.userId} · {new Date(order.createdAt).toLocaleString("en-IN")}</span></div><div><strong>{order.items?.length || 0} item(s)</strong><select value={order.status} onChange={(event) => updateOrderStatus(order, event.target.value)}><option>PLACED</option><option>CONFIRMED</option><option>PACKED</option><option>SHIPPED</option><option>DELIVERED</option><option>CANCELLED</option></select></div></article>)}</div></section>
              )}

              {section === "inventory" && (
                <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">INVENTORY VIEW</p><h2>Stock Levels</h2></div><span>{lowStock.length} low-stock</span></div><div className="inventory-grid">{products.filter((p) => p.status !== "INACTIVE").map((product) => <div className={`inventory-card ${Number(product.stock) <= 5 ? "low" : ""}`} key={product.id}><span>{product.category}</span><strong>{product.name}</strong><div className="inventory-number">{product.stock}</div><small>{product.stock <= 5 ? "Restock soon" : "Healthy stock"}</small><button type="button" onClick={() => editProduct(product)}>Update stock →</button></div>)}</div></section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Admin;
