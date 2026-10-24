const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const formatCurrency = (value) => formatter.format(Number(value) || 0);