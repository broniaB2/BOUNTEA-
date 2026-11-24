import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { mockLogin } from "../services/authService";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function updateField(field) {
    return (event) => {
      setForm((previous) => ({ ...previous, [field]: event.target.value }));
      setError("");
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = mockLogin(form);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onLogin(result.profile);
    navigate(location.state?.from || "/", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-icon"><Sparkles size={23} /></div>
        <div>
          <strong>BOUNTEA</strong>
          <span>Work. Earn. Grow.</span>
        </div>
      </div>
      <main className="auth-card">
        <div className="auth-heading">
          <div className="auth-icon"><LockKeyhole size={21} /></div>
          <p className="eyebrow">WELCOME BACK</p>
          <h1>Log in to BOUNTEA</h1>
          <p>Continue building opportunities on the Stellar ecosystem.</p>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={updateField("email")}
            placeholder="you@example.com"
          />
          <div className="auth-label-row">
            <label htmlFor="login-password">Password</label>
            <button type="button" className="text-button" onClick={() => setError("Password reset will be available when authentication is connected.")}>
              Forgot password?
            </button>
          </div>
          <div className="password-field">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={updateField("password")}
              placeholder="Enter your password"
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <label className="checkbox-label">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <button type="submit" className="primary-button auth-submit">Log in</button>
        </form>
        <p className="auth-switch">New to BOUNTEA? <Link to="/signup">Create an account</Link></p>
        <p className="mock-auth-note">Development demo authentication only. Accounts and passwords are stored in this browser so you can log back in after a refresh.</p>
      </main>
    </div>
  );
}

export default Login;
