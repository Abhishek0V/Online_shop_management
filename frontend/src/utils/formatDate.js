export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";