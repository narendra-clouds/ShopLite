import { useState } from "react";

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    // Validate registration passwords
    if (isRegister && password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // API Gateway endpoints
      const url = isRegister
        ? "http://localhost:8080/register"
        : "http://localhost:8080/login";

      // Request body
      const body = isRegister
        ? {
            name,
            email,
            password,
          }
        : {
            email,
            password,
          };

      // Send request to API Gateway
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Successful response
      if (response.ok) {
        setMessage(data.message);

        // Clear registration form
        if (isRegister) {
          setName("");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        // API error
        setMessage(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("API Error:", error);

      setMessage(
        "Unable to connect to API Gateway. Make sure all services are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          🛒
        </div>

        {/* Authentication Header */}
        <div className="auth-header">
          <h1 className="auth-title">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h1>

          <p>
            {isRegister
              ? "Create your ShopLite account"
              : "Login to your ShopLite account"}
          </p>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit}>

          {/* Name - Register Only */}
          {isRegister && (
            <div className="input-group">
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password - Register Only */}
          {isRegister && (
            <div className="input-group">
              <label>Confirm Password</label>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* API Message */}
          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        {/* Login / Register Switch */}
        <div className="auth-switch">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            className="switch-button"
            onClick={() => {
              setIsRegister(!isRegister);
              setMessage("");
            }}
          >
            {isRegister ? " Login" : " Register"}
          </button>
        </div>

        {/* Back to ShopLite */}
        <button
          type="button"
          className="back-button"
          onClick={() => window.location.reload()}
        >
          ← Back to ShopLite
        </button>

      </div>
    </div>
  );
}

export default Login;