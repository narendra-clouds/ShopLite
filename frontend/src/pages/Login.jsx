import { useState } from "react";

function Login({ onLogin, onBack }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (isRegister && password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const url = isRegister
        ? "http://localhost:8080/register"
        : "http://localhost:8080/login";

      const body = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.message || "Something went wrong");
        return;
      }

      if (isRegister) {
        setMessageType("success");
        setMessage("Account created successfully. Please login.");
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (!data.user?.id) {
        setMessageType("error");
        setMessage("Login succeeded but the user information was incomplete.");
        return;
      }

      onLogin({ ...data.user, token: data.token });
    } catch (error) {
      console.error("Authentication error:", error);
      setMessageType("error");
      setMessage("Unable to connect to API Gateway. Make sure all services are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛍️</div>
        <div className="auth-header">
          <p className="eyebrow">SHOPLITE</p>
          <h1 className="auth-title">{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p>{isRegister ? "Create your ShopLite account" : "Login to continue shopping"}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" required />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          </div>

          {isRegister && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password" required />
            </div>
          )}

          {message && <div className={`auth-message ${messageType}`}>{message}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        {!isRegister && <p className="auth-demo-note">Shop owner access is provided through the configured admin account.</p>}

        <div className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            className="switch-button"
            type="button"
            onClick={() => {
              setIsRegister((value) => !value);
              setMessage("");
            }}
          >
            {isRegister ? " Login" : " Register"}
          </button>
        </div>

        <button className="back-button" type="button" onClick={onBack}>
          ← Back to ShopLite
        </button>
      </div>
    </div>
  );
}

export default Login;
