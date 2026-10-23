import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import FormField from "../../components/FormField";
import { resetPassword } from "../../api/authApi";
import { parseApiError } from "../../utils/apiErrors";
import { runValidators, validateConfirm, validatePassword } from "../../utils/validators";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState({ new_password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [linkError, setLinkError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLinkError("");
    const found = runValidators(values, {
      new_password: validatePassword,
      confirm_password: validateConfirm(values.new_password),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await resetPassword({ uid, token, ...values });
      toast.success("Password reset. Please log in.");
      navigate("/login");
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      const { token: tokenProblem, uid: uidProblem, ...rest } = fieldErrors;
      setErrors(rest);
      setLinkError(tokenProblem || uidProblem || message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Set a new password</h1>
        {linkError && (
          <div className="form-error" role="alert">
            {linkError} <Link to="/forgot-password">Request a new link</Link>
          </div>
        )}
        <FormField label="New password" name="new_password" type="password" value={values.new_password} onChange={handleChange} error={errors.new_password} autoComplete="new-password" />
        <FormField label="Confirm new password" name="confirm_password" type="password" value={values.confirm_password} onChange={handleChange} error={errors.confirm_password} autoComplete="new-password" />
        <button className="btn btn-primary btn-block" disabled={submitting}>{submitting ? "Saving..." : "Reset password"}</button>
        <p className="auth-footer"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}