import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../../components/FormField";
import { forgotPassword } from "../../api/authApi";
import { parseApiError } from "../../utils/apiErrors";
import { validateEmail } from "../../utils/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;

    setSubmitting(true);
    try {
      const { data } = await forgotPassword(email.trim().toLowerCase());
      setSentMessage(data.detail);
    } catch (err) {
      setError(parseApiError(err).message || "Could not send the email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Forgot password</h1>
        <p className="auth-sub">Enter your email and we will send you a reset link.</p>

        {sentMessage ? (
          <div className="form-success" role="status">{sentMessage} Check your inbox (and spam folder).</div>
        ) : (
          <>
            <FormField label="Email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} error={error} autoComplete="email" />
            <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? "Sending..." : "Send reset link"}</button>
          </>
        )}
        <p className="auth-footer"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}