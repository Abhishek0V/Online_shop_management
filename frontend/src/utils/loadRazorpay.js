const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loading = null;

// Loads Razorpay's checkout script once, only when the customer reaches checkout.
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.onload = resolve;
      script.onerror = () => { loading = null; reject(new Error("Razorpay failed to load")); };
      document.body.appendChild(script);
    });
  }
  return loading;
}