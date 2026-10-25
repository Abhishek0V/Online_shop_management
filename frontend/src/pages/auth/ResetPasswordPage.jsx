
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, KeyRound, LockKeyhole } from "lucide-react";

import FormField from "../../components/FormField";
import { resetPassword } from "../../api/authApi";
import { parseApiError } from "../../utils/apiErrors";
import {
  runValidators,
  validateConfirm,
  validatePassword,
} from "../../utils/validators";

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [linkError, setLinkError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setLinkError("");
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
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f7f7f5] px-4 py-12">
      <div className="w-full max-w-md">
        {/* HEADING */}
        <div className="mb-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center bg-[#f5c32c] text-black">
            <KeyRound size={22} strokeWidth={1.8} />
          </div>

          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
           ACCOUNT SECURITY
          </p>

          <h1 className="text-3xl font-black uppercase tracking-tight text-[#242424]">
            Set a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            Create a new password for your account. Choose a strong password
            that you haven't used before.
          </p>
        </div>

        {/* INVALID LINK OR API ERROR */}
        {linkError && (
          <div
            role="alert"
            className="mb-5 border-l-4 border-red-500 bg-white p-4"
          >
            <p className="text-sm leading-6 text-red-700">{linkError}</p>

            <Link
              to="/forgot-password"
              className="mt-2 inline-block text-xs font-black text-[#987000] underline underline-offset-4 hover:text-black"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {/* PASSWORD FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="New password"
            name="new_password"
            type="password"
            value={values.new_password}
            onChange={handleChange}
            error={errors.new_password}
            autoComplete="new-password"
          />

          <div className="mt-4">
            <FormField
              label="Confirm new password"
              name="confirm_password"
              type="password"
              value={values.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
              autoComplete="new-password"
            />
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-stone-500">
            <LockKeyhole
              size={15}
              className="mt-0.5 shrink-0 text-[#a17b00]"
            />
            Make sure both password fields match.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-[#f5c32c] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-[#e5b51f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Reset password"}
          </button>
        </form>

        {/* BACK TO LOGIN */}
        <div className="mt-7 border-t border-stone-200 pt-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 transition hover:text-[#987000]"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
