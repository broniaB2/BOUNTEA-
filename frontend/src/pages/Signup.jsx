import { useState } from "react";
import { BriefcaseBusiness, Eye, EyeOff, Sparkles, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { mockSignUp } from "../services/authService";
import { WORKER_SKILLS } from "../data/workerSkills";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "worker",
  skills: [],
};

function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");

  function updateField(field) {
    return (event) => {
      setForm((previous) => ({ ...previous, [field]: event.target.value }));
      setError("");
    };
  }

  function toggleSkill(skill) {
    setForm((previous) => ({
      ...previous,
      skills: previous.skills.includes(skill)
        ? previous.skills.filter((item) => item !== skill)
        : [...previous.skills, skill],
    }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.role === "worker" && form.skills.length === 0) {
      setError("Select at least one skill so your agent can match tasks.");
      return;
    }

    const result = mockSignUp({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      skills: form.role === "worker" ? form.skills : [],
    });
    if (!result.success) {
      setError(result.error);
      return;
    }

    onLogin(result.profile);
    navigate("/", { replace: true });
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
      <main className="auth-card auth-card-signup">
        <div className="auth-heading">
          <div className="auth-icon"><UserRound size={21} /></div>
          <p className="eyebrow">JOIN THE NETWORK</p>
          <h1>Create your BOUNTEA account</h1>
          <p>Choose how you want to participate in the future of work.</p>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Full name</label>
          <input id="signup-name" required value={form.name} onChange={updateField("name")} placeholder="Your full name" autoComplete="name" />
          <label htmlFor="signup-email">Email address</label>
          <input id="signup-email" type="email" required value={form.email} onChange={updateField("email")} placeholder="you@example.com" autoComplete="email" />
          <label htmlFor="signup-password">Password</label>
          <div className="password-field">
            <input id="signup-password" type={showPassword ? "text" : "password"} required minLength="8" value={form.password} onChange={updateField("password")} placeholder="At least 8 characters" autoComplete="new-password" />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <label htmlFor="signup-confirm-password">Confirm password</label>
          <div className="password-field">
            <input id="signup-confirm-password" type={showConfirmation ? "text" : "password"} required value={form.confirmPassword} onChange={updateField("confirmPassword")} placeholder="Repeat your password" autoComplete="new-password" />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"}>
              {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <fieldset className="role-options">
            <legend>Account type</legend>
            <label className={`role-option ${form.role === "worker" ? "selected" : ""}`}>
              <input type="radio" name="role" value="worker" checked={form.role === "worker"} onChange={updateField("role")} />
              <UserRound size={18} />
              <span><strong>Worker</strong><small>Complete tasks and earn rewards</small></span>
            </label>
            <label className={`role-option ${form.role === "business" ? "selected" : ""}`}>
              <input type="radio" name="role" value="business" checked={form.role === "business"} onChange={updateField("role")} />
              <BriefcaseBusiness size={18} />
              <span><strong>Business</strong><small>Post bounties and review work</small></span>
            </label>
          </fieldset>
          {form.role === "worker" && (
            <fieldset className="skill-options">
              <legend>Worker agent skills (used to match tasks)</legend>
              <div className="skill-grid">
                {WORKER_SKILLS.map((skill) => (
                  <label key={skill} className={`skill-chip ${form.skills.includes(skill) ? "selected" : ""}`}>
                    <input
                      type="checkbox"
                      checked={form.skills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button type="submit" className="primary-button auth-submit">Create account</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
        <p className="mock-auth-note">Development demo authentication only. Your account is saved in this browser so you can log back in after a refresh.</p>
      </main>
    </div>
  );
}

export default Signup;
