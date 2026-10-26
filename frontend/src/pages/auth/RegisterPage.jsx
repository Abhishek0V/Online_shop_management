import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Hammer,
  Wrench,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { parseApiError } from "../../utils/apiErrors";
import {
  normalizePhone,
  required,
  runValidators,
  validateConfirm,
  validateEmail,
  validatePassword,
  validatePhone,
} from "../../utils/validators";

const INITIAL = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rules = {
    first_name: required("First name"),
    email: validateEmail,
    phone: validatePhone,
    password: validatePassword,
    confirm_password: validateConfirm(values.password),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "password" ? { confirm_password: "" } : {}),
    }));

    setFormError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const rule = rules[name];

    if (rule) {
      setErrors((prev) => ({
        ...prev,
        [name]: rule(value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const found = runValidators(values, rules);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        ...values,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: normalizePhone(values.phone),
      });

      toast.success("Account created. Please log in.");
      navigate("/login", { replace: true });
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);

      setErrors(fieldErrors || {});

      setFormError(
        message ||
          (Object.keys(fieldErrors || {}).length
            ? ""
            : "Registration failed. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `w-full rounded-md border px-3 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#c89c14] focus:ring-2 focus:ring-[#f5c32c]/20 ${
      errors[name] ? "border-red-500" : "border-stone-300"
    }`;

  const renderPasswordInput = (
    name,
    label,
    placeholder,
    visible,
    toggleVisibility,
  ) => (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold">
        {label} *
      </label>

      <div
        className={`flex items-center rounded-md border pr-3 transition focus-within:border-[#c89c14] focus-within:ring-2 focus-within:ring-[#f5c32c]/20 ${
          errors[name] ? "border-red-500" : "border-stone-300"
        }`}
      >
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          value={values[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          className="w-full rounded-md bg-transparent px-3 py-3 text-sm outline-none placeholder:text-stone-400"
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 text-stone-500 hover:text-black"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {errors[name] && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
          {errors[name]}
        </p>
      )}

      {name === "password" && !errors.password && (
        <p className="mt-1 text-[10px] text-stone-500">
          At least 8 characters, not only numbers.
        </p>
      )}
    </div>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f4ef] px-4 py-8">
      <div className="grid w-full max-w-[820px] overflow-hidden rounded-xl bg-white shadow-[0_12px_45px_rgba(0,0,0,0.10)] sm:grid-cols-[0.8fr_1.2fr]">
        {/* LEFT PANEL */}
        <section className="relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-[#f5c32c] p-5 sm:min-h-[650px] sm:p-7">
          <Link to="/" className="flex w-fit items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#242424] text-[#f5c32c]">
              <Hammer size={24} />
            </span>

            <span>
              <span className="block text-xl font-black tracking-tight">
                FORGE.
              </span>
              <span className="block text-[8px] font-bold tracking-[0.18em]">
                HARDWARE & TOOLS
              </span>
            </span>
          </Link>

          <div className="relative z-10 mt-6 max-w-[240px] sm:mt-0">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em]">
              Start building
            </p>

            <h1 className="text-3xl font-black leading-tight sm:text-4xl">
              Join
              <br />
              Forge.
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#423720]">
              Create your account and find the right tools for every project.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <Wrench size={20} />
              <span className="text-xs font-bold">
                Everything you need to build.
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-5 hidden sm:block">
           
          </div>

          <Hammer
            size={150}
            strokeWidth={0.7}
            className="pointer-events-none absolute -bottom-8 -right-8 rotate-[-20deg] text-black/[0.07]"
          />
        </section>

        {/* RIGHT PANEL */}
        <section className="flex flex-col justify-center p-5 sm:p-8 md:p-9">
          <div className="mb-5">
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-black"
            >
              <ArrowLeft size={14} />
              Back to store
            </Link>

            <h2 className="text-2xl font-black tracking-tight">
              Create account
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              Register to buy hardware and spare parts.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* FORM ERROR */}
            {formError && (
              <p
                role="alert"
                className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {formError}
              </p>
            )}

            {/* FIRST AND LAST NAME */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first_name"
                  className="mb-1.5 block text-xs font-bold"
                >
                  First name *
                </label>

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  value={values.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={Boolean(errors.first_name)}
                  className={inputClass("first_name")}
                />

                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="mb-1.5 block text-xs font-bold"
                >
                  Last name
                </label>

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={values.last_name}
                  onChange={handleChange}
                  className={inputClass("last_name")}
                />

                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold">
                Email address *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errors.email)}
                className={inputClass("email")}
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-bold">
                Phone number *
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Enter your mobile number"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(errors.phone)}
                className={inputClass("phone")}
              />

              {errors.phone ? (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              ) : (
                <p className="mt-1 text-[10px] text-stone-500">
                  Enter your 10-digit mobile number.
                </p>
              )}
            </div>

            {/* PASSWORD */}
            {renderPasswordInput(
              "password",
              "Password",
              "Create a password",
              showPassword,
              () => setShowPassword((prev) => !prev),
            )}

            {/* CONFIRM PASSWORD */}
            {renderPasswordInput(
              "confirm_password",
              "Confirm password",
              "Re-enter your password",
              showConfirmPassword,
              () => setShowConfirmPassword((prev) => !prev),
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-md bg-[#242424] px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#d6a600] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* LOGIN LINK */}

          <p className="mt-5 text-center text-xs text-stone-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-[#987000] transition-colors hover:text-black"
            >
              Login
            </Link>
          </p>

         
        </section>
      </div>
    </main>
  );
}
