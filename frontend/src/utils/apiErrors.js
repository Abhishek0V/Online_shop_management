// Turns a DRF error response into { fieldErrors, message, status } for forms.
export function parseApiError(error) {
  const status = error.response?.status;
  const data = error.response?.data;
  if (!error.response) return { fieldErrors: {}, message: "Cannot reach the server. Please try again." };
  if (status === 429) return { fieldErrors: {}, message: "Too many attempts. Please wait a minute and try again.", status };
  if (status >= 500) return { fieldErrors: {}, message: "Something went wrong on our side. Please try again.", status };

  const fieldErrors = {};
  let message = "";
  if (data && typeof data === "object") {
    Object.entries(data).forEach(([key, value]) => {
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      if (key === "detail" || key === "non_field_errors") message = text;
      else fieldErrors[key] = text;
    });
  }
  return { fieldErrors, message, status };
}