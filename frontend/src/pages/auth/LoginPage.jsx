import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../utils/apiErrors";
import { required, runValidators, validateEmail } from "../../utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = runValidators(values, { email: validateEmail, password: required("Password") });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const user = await login({ email: values.email.trim().toLowerCase(), password: values.password });
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate(location.state?.from || (user.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (err) {
      const { message, status } = parseApiError(err);
      setFormError(status === 401 ? "Invalid email or password." : message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Login</h1>
        <p className="auth-sub">Welcome back. Sign in to continue.</p>
        {formError && <div className="form-error" role="alert">{formError}</div>}

        <FormField label="Email" name="email" type="email" value={values.email} onChange={handleChange} error={errors.email} autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={values.password} onChange={handleChange} error={errors.password} autoComplete="current-password" />
        <div className="auth-row"><Link to="/forgot-password">Forgot password?</Link></div>

        <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? "Signing in..." : "Login"}</button>
        <p className="auth-footer">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}