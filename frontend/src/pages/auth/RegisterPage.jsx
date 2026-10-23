import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../utils/apiErrors";
import {
  normalizePhone, required, runValidators, validateConfirm, validateEmail, validatePassword, validatePhone,
} from "../../utils/validators";

const INITIAL = { first_name: "", last_name: "", email: "", phone: "", password: "", confirm_password: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rules = {
    first_name: required("First name"),
    email: validateEmail,
    phone: validatePhone,
    password: validatePassword,
    confirm_password: validateConfirm(values.password),
  };

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleBlur = (e) => {
    const rule = rules[e.target.name];
    if (rule) setErrors((prev) => ({ ...prev, [e.target.name]: rule(e.target.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = runValidators(values, rules);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ ...values, email: values.email.trim().toLowerCase(), phone: normalizePhone(values.phone) });
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors);
      setFormError(message || (Object.keys(fieldErrors).length ? "" : "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="auth-sub">Register to buy hardware and spare parts.</p>
        {formError && <div className="form-error" role="alert">{formError}</div>}

        <div className="grid-2">
          <FormField label="First name *" name="first_name" value={values.first_name} onChange={handleChange} onBlur={handleBlur} error={errors.first_name} autoComplete="given-name" />
          <FormField label="Last name" name="last_name" value={values.last_name} onChange={handleChange} error={errors.last_name} autoComplete="family-name" />
        </div>
        <FormField label="Email *" name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} autoComplete="email" />
        <FormField label="Phone *" name="phone" type="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} hint="10-digit mobile number" autoComplete="tel" />
        <FormField label="Password *" name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} hint="At least 8 characters, not only numbers" autoComplete="new-password" />
        <FormField label="Confirm password *" name="confirm_password" type="password" value={values.confirm_password} onChange={handleChange} onBlur={handleBlur} error={errors.confirm_password} autoComplete="new-password" />

        <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? "Creating account..." : "Register"}</button>
        <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}