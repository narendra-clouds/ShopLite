import { useEffect, useMemo, useState } from "react";

const readResponseData = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); }
  catch {
    return { message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || `Request failed (${response.status})` };
  }
};

const API = "http://127.0.0.1:8080";
const TOKEN_KEY = "shopliteToken";

const emptyProduct = {
  name: "",
  price: "",
  category: "Electronics",
  description: "",
  stock: "",
  image: "",
  status: "ACTIVE",
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
  const [toast, setToast] = useState(null);
  const [productFilter, setProductFilter] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");
  const [productSort, setProductSort] = useState("NEWEST");

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
    const data = await readResponseData(response);
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [productData, userData, orderData] = await Promise.all([
        request("/admin/products"),
        request("/users"),
        request("/orders"),
      ]);
      setProducts(productData.products || []);
      setUsers(userData.users || []);
      setOrders(orderData.orders || []);
    } catch (err) {
      showToast(err.message || "Unable to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const activeOrders = orders.filter((order) => order.status !== "CANCELLED");
  const revenue = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cancelledValue = orders.filter((order) => order.status === "CANCELLED").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const pending = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
  const lowStock = products.filter((product) => product.status !== "INACTIVE" && Number(product.stock) <= 5);
  const filteredAdminProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const result = products.filter((product) => {
      const status = product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
      const stock = Number(product.stock || 0);
      const matchesFilter =
        productFilter === "ALL" ||
        (productFilter === "ACTIVE" && status === "ACTIVE") ||
        (productFilter === "INACTIVE" && status === "INACTIVE") ||
        (productFilter === "LOW_STOCK" && status === "ACTIVE" && stock > 0 && stock <= 5) ||
        (productFilter === "OUT_OF_STOCK" && stock === 0);
      const matchesSearch = !query || `${product.name} ${product.category} ${product.description || ""}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
    return result.sort((a, b) => {
      if (productSort === "PRICE_LOW") return Number(a.price) - Number(b.price);
      if (productSort === "PRICE_HIGH") return Number(b.price) - Number(a.price);
      if (productSort === "NAME") return String(a.name).localeCompare(String(b.name));
      return Number(b.id) - Number(a.id);
    });
  }, [products, productFilter, productSearch, productSort]);

  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be 2 MB or smaller", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result || "") }));
    reader.onerror = () => showToast("Unable to read the image", "error");
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(emptyProduct);
    setEditingId(null);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
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
      showToast(editingId ? "Product updated successfully" : "Product added successfully");
      resetForm();
      await loadAll();
    } catch (err) {
      showToast(err.message || "Unable to save product", "error");
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
      status: product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deactivateProduct = async (product) => {
    if (!window.confirm(`Deactivate ${product.name}?`)) return;
    try {
      await request(`/admin/products/${product.id}`, { method: "DELETE" });
      showToast(`${product.name} was deactivated`);
      await loadAll();
    } catch (err) {
      showToast(err.message || "Unable to deactivate product", "error");
    }
  };

  const activateProduct = async (product) => {
    try {
      await request(`/admin/products/${product.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      showToast(`${product.name} is active again`);
      await loadAll();
    } catch (err) {
      showToast(err.message || "Unable to activate product", "error");
    }
  };

  const updateOrderStatus = async (order, status) => {
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      const confirmed = window.confirm(`Cancel order #${order.id}? Reserved stock will be returned to inventory.`);
      if (!confirmed) return;
    }
    try {
      await request(`/orders/${order.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      showToast(`Order #${order.id} updated to ${status}`);
      await loadAll();
    } catch (err) {
      showToast(err.message || "Unable to update order", "error");
    }
  };

  return (
    <div className="admin-page">
      {toast && <div className={`admin-toast ${toast.type}`} role="status"><span>{toast.type === "error" ? "!" : "✓"}</span><p>{toast.message}</p><button type="button" onClick={() => setToast(null)} aria-label="Close notification">×</button></div>}
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

              {section === "dashboard" && (
                <section className="admin-panel">
                  <div className="admin-panel-title"><div><p className="eyebrow">SHOPLITE ANALYTICS</p><h2>Business Overview</h2></div><span>Live from current services</span></div>
                  <div className="analytics-grid">
                    <div className="analytics-card"><span>Total Users</span><strong>{users.length}</strong><small>Registered accounts</small></div>
                    <div className="analytics-card"><span>Total Orders</span><strong>{orders.length}</strong><small>{pending} active · {delivered} delivered</small></div>
                    <div className="analytics-card"><span>Net Sales</span><strong>{money(revenue)}</strong><small>Order value excluding cancelled orders</small></div>
                    <div className="analytics-card"><span>Inventory Alerts</span><strong>{lowStock.length}</strong><small>{products.filter((p) => Number(p.stock) === 0).length} out of stock</small></div>
                    <div className="analytics-card"><span>Cancelled Value</span><strong>{money(cancelledValue)}</strong><small>Not included in net sales</small></div>
                  </div>
                  <div className="analytics-two-col"><div><h3>Order Status</h3>{["PLACED","CONFIRMED","PACKED","SHIPPED","DELIVERED","CANCELLED"].map((status) => { const count=orders.filter(o=>o.status===status).length; return <div className="analytics-row" key={status}><span>{status}</span><b>{count}</b></div>; })}</div><div><h3>Catalog Snapshot</h3><div className="analytics-row"><span>Active products</span><b>{products.filter(p=>p.status!=="INACTIVE").length}</b></div><div className="analytics-row"><span>Inactive products</span><b>{products.filter(p=>p.status==="INACTIVE").length}</b></div><div className="analytics-row"><span>Units in stock</span><b>{products.reduce((sum,p)=>sum+Number(p.stock||0),0)}</b></div></div></div>
                </section>
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
                      <label>Product Image <span>(optional · JPG, PNG, WEBP · max 2 MB)</span>
                        <input name="imageFile" type="file" accept="image/*" onChange={handleImageChange} />
                      </label>
                      {form.image && <div className="admin-image-preview"><img src={form.image} alt="Product preview" /><button type="button" onClick={() => setForm((current) => ({ ...current, image: "" }))}>Remove image</button></div>}
                      {editingId && (
                        <label>Status<select name="status" value={form.status || "ACTIVE"} onChange={updateForm}><option value="ACTIVE">ACTIVE — Available to customers</option><option value="INACTIVE">INACTIVE — Hidden from customers</option></select></label>
                      )}
                      <button className="primary-btn full" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}</button>
                    </form>
                  </section>
                  <section className="admin-panel">
                    <div className="admin-panel-title"><div><p className="eyebrow">CATALOG</p><h2>Products</h2></div><span>{filteredAdminProducts.length} shown · {products.length} total</span></div>
                    <div className="admin-product-toolbar">
                      <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search products..." aria-label="Search admin products" />
                      <div className="admin-filter-pills">{[["ALL","All"],["ACTIVE","Active"],["INACTIVE","Inactive"],["LOW_STOCK","Low Stock"],["OUT_OF_STOCK","Out of Stock"]].map(([id,label]) => <button key={id} type="button" className={productFilter === id ? "active" : ""} onClick={() => setProductFilter(id)}>{label}</button>)}</div>
                      <select value={productSort} onChange={(event) => setProductSort(event.target.value)} aria-label="Sort products"><option value="NEWEST">Newest</option><option value="NAME">Name A–Z</option><option value="PRICE_LOW">Price low → high</option><option value="PRICE_HIGH">Price high → low</option></select>
                    </div>
                    <div className="admin-product-list">
                      {filteredAdminProducts.length === 0 ? <div className="admin-empty-state"><strong>No products found</strong><span>Try another search or filter.</span></div> : filteredAdminProducts.map((product) => {
                        const status = product.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
                        const stock = Number(product.stock || 0);
                        const stockLabel = stock === 0 ? "Out of stock" : stock <= 5 ? `${stock} left · Low stock` : `${stock} in stock`;
                        return <article className={`admin-product-card ${status === "INACTIVE" ? "inactive" : ""}`} key={product.id}>
                          <div className="admin-product-visual">{product.image ? <img src={product.image} alt="" /> : "🛍️"}</div>
                          <div className="admin-product-info">
                            <div><strong>{product.name}</strong><span>{product.category}</span><span className={`product-status-badge ${status.toLowerCase()}`}>{status === "ACTIVE" ? "● Active" : "● Inactive"}</span></div>
                            <div><b>{money(product.price)}</b><em className={stock <= 5 ? "low" : ""}>{stockLabel}</em></div>
                          </div>
                          <div className="admin-product-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button>{status === "ACTIVE" ? <button className="danger-text" type="button" onClick={() => deactivateProduct(product)}>Deactivate</button> : <button className="activate-text" type="button" onClick={() => activateProduct(product)}>Activate</button>}</div>
                        </article>;
                      })}
                    </div>
                  </section>
                </div>
              )}

              {section === "users" && (
                <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">USER SERVICE</p><h2>Registered Users</h2></div><span>{users.length} accounts</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Orders</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>#{item.id}</td><td><strong>{item.name}</strong></td><td>{item.email}</td><td><span className="role-badge">{item.role}</span></td><td>{item.status}</td><td>{orders.filter((order) => String(order.userId) === String(item.id)).length}</td></tr>)}</tbody></table></div></section>
              )}

              {section === "orders" && (
                <section className="admin-panel">
                  <div className="admin-panel-title"><div><p className="eyebrow">ORDER SERVICE</p><h2>Customer Orders</h2></div><span>{orders.length} orders</span></div>
                  <div className="admin-orders-list">
                    {orders.length === 0 ? <div className="admin-empty-state"><strong>No orders yet</strong><span>Customer orders will appear here.</span></div> : orders.slice().reverse().map((order) => {
                      const address = order.deliveryAddress || {};
                      const customer = users.find((item) => String(item.id) === String(order.userId));
                      const total = Number(order.total || (order.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
                      return <article className="admin-order-card rich" key={order.id}>
                        <div className="admin-order-main">
                          <div className="admin-order-heading"><div><strong>Order #{order.id}</strong><span>{new Date(order.createdAt).toLocaleString("en-IN")}</span></div><span className={`product-status-badge ${String(order.status).toLowerCase()}`}>● {order.status}</span></div>
                          <div className="admin-order-columns">
                            <div><p className="admin-order-label">CUSTOMER</p><strong>{order.customerName || customer?.name || `User #${order.userId}`}</strong><span>{order.customerEmail || customer?.email || ""}</span><span>Phone: {address.phone || "Not provided"}</span></div>
                            <div><p className="admin-order-label">DELIVERY ADDRESS</p><strong>{address.fullName || order.customerName || "Customer"}</strong><span>{address.address || "Address unavailable"}</span><span>{[address.city, address.state].filter(Boolean).join(", ")}{address.pincode ? ` - ${address.pincode}` : ""}</span></div>
                            <div><p className="admin-order-label">ORDER TOTAL</p><strong>{money(total)}</strong><span>{order.items?.length || 0} product line(s)</span></div>
                          </div>
                          <div className="admin-order-items">{(order.items || []).map((item, index) => <div className="admin-order-item" key={`${order.id}-${item.productId}-${index}`}><div className="admin-order-item-image">{item.image ? <img src={item.image} alt="" /> : "🛍️"}</div><div><strong>{item.name || `Product #${item.productId}`}</strong><span>{money(item.price)} × {item.quantity}</span></div><b>{money(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0))}</b></div>)}</div>
                        </div>
                        <div className="admin-order-status-box"><label>Status<select value={order.status} onChange={(event) => updateOrderStatus(order, event.target.value)}><option>PLACED</option><option>CONFIRMED</option><option>PACKED</option><option>SHIPPED</option><option>DELIVERED</option><option>CANCELLED</option></select></label></div>
                      </article>;
                    })}
                  </div>
                </section>
              )}

              {section === "inventory" && (
                <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">INVENTORY VIEW</p><h2>Stock Levels</h2></div><span>{lowStock.length} low-stock · {products.filter((p) => Number(p.stock) === 0).length} out</span></div><div className="inventory-grid">{products.map((product) => { const stock = Number(product.stock || 0); const inactive = product.status === "INACTIVE"; return <div className={`inventory-card ${stock === 0 ? "out" : stock <= 5 ? "low" : ""} ${inactive ? "inactive" : ""}`} key={product.id}><span>{product.category}</span><strong>{product.name}</strong><div className="inventory-number">{stock}</div><small>{inactive ? "Product inactive" : stock === 0 ? "Out of stock" : stock <= 5 ? "Restock soon" : "Healthy stock"}</small><div className="inventory-actions"><button type="button" onClick={() => editProduct(product)}>Update stock →</button>{inactive ? <button type="button" className="activate-text" onClick={() => activateProduct(product)}>Activate</button> : <button type="button" className="danger-text" onClick={() => deactivateProduct(product)}>Deactivate</button>}</div></div>; })}</div></section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Admin;
