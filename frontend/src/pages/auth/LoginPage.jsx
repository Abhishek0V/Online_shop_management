import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Hammer,
  Wrench,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../utils/apiErrors";
import { required, runValidators, validateEmail } from "../../utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate using your existing validation utilities.
    const found = runValidators(values, {
      email: validateEmail,
      password: required("Password"),
    });

    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      // Use the existing AuthContext login process.
      const user = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      toast.success(
        `Welcome back${user?.first_name ? `, ${user.first_name}` : ""}!`,
      );

      // Redirect to the originally requested page when applicable.
      const redirectTo =
        location.state?.from || (user?.role === "admin" ? "/admin" : "/");

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const { message, status } = parseApiError(err);

      setFormError(
        status === 401
          ? "Invalid email or password."
          : message || "Login failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-8">
      <div className="grid w-full max-w-[760px] overflow-hidden rounded-xl bg-white shadow-[0_12px_45px_rgba(0,0,0,0.10)] sm:grid-cols-[0.8fr_1.2fr]">
        {/* LEFT PANEL */}
        <section className="relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-[#f5c32c] p-5 sm:min-h-[440px] sm:p-7">
          <Link to="/" className="flex w-fit items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#242424] text-[#f5c32c]">
              <Hammer size={24} />
            </span>

            <span>
              <span className="block text-xl font-black tracking-tight">
                FORGE.
              </span>
              <span className="block text-[8px] text-white font-bold tracking-[0.18em]">
                HARDWARE & TOOLS
              </span>
            </span>
          </Link>

          <div className="relative z-10 mt-6 max-w-[240px] sm:mt-0">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]">
              Your trusted partner
            </p>

            <h1 className="text-3xl font-black leading-tight sm:text-4xl">
              Welcome
              <br />
              back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#423720]">
              Your next project starts with the right tools.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <Wrench size={20} />
              <span className="text-xs font-bold">Build with confidence.</span>
            </div>
          </div>

          <div className="relative z-10 mt-5 hidden sm:block">
            {/* <p className="mt-4 text-[9px] font-black tracking-[0.15em]">
              QUALITY YOU CAN TRUST.
            </p> */}
          </div>

          <Hammer
            size={150}
            strokeWidth={0.7}
            className="pointer-events-none absolute -bottom-8 -right-8 rotate-[-20deg] text-black/[0.07]"
          />
        </section>

        {/* RIGHT PANEL */}
        <section className="flex flex-col justify-center p-5 sm:p-8 md:p-9">
          <div className="mb-6">
            <Link
              to="/"
              className="mb-5 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-black"
            >
              <ArrowLeft size={14} />
              Back to store
            </Link>

            <h2 className="text-2xl font-black tracking-tight">Login</h2>

            <p className="mt-1 text-xs text-stone-500">
              Access your Forge account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full rounded-md border px-3 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#c89c14] focus:ring-2 focus:ring-[#f5c32c]/20 ${
                  errors.email ? "border-red-500" : "border-stone-300"
                }`}
              />

              {errors.email && (
                <p id="email-error" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-xs font-bold">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-[#987000] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div
                className={`flex items-center rounded-md border pr-3 transition focus-within:border-[#c89c14] focus-within:ring-2 focus-within:ring-[#f5c32c]/20 ${
                  errors.password ? "border-red-500" : "border-stone-300"
                }`}
              >
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className="w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none placeholder:text-stone-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-stone-500 hover:text-black"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {errors.password && (
                <p id="password-error" className="mt-1 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* API / LOGIN ERROR */}
            {formError && (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {formError}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-md bg-[#242424] px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#d6a600] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Login to Account"}
            </button>
          </form>

          {/* REGISTER LINK */}

          <p className="mt-5 text-center text-xs text-stone-500">
            New to Forge?{" "}
            <Link
              to="/register"
              className="font-bold text-[#987000] hover:underline"
            >
              Sign up
            </Link>
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
            <ShieldCheck size={14} className="text-green-700" />
            Your account details are protected.
          </p>
        </section>
      </div>
    </main>
  );
}
