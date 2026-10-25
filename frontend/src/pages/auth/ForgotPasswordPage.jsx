
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";

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
      setError(
        parseApiError(err).message ||
          "Could not send the email. Please try again."
      );
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
            FORGE / ACCOUNT RECOVERY
          </p>

          <h1 className="text-3xl font-black uppercase tracking-tight text-[#242424]">
            Forgot password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            No worries. Enter your registered email address and we'll send you
            a link to reset your password.
          </p>
        </div>

        {/* FORM */}
        {sentMessage ? (
          <div
            role="status"
            className="border-l-4 border-green-600 bg-white p-5"
          >
            <div className="flex items-start gap-3">
              <Mail
                size={21}
                className="mt-0.5 shrink-0 text-green-700"
              />
              <div>
                <h2 className="text-sm font-black text-[#242424]">
                  Check your email
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {sentMessage} Check your inbox and spam folder.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Email address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              error={error}
              autoComplete="email"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center bg-[#f5c32c] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-[#e5b51f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

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
