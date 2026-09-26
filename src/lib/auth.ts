export function authError(code?: string) {
  if (code === "email_not_confirmed") return "unconfirmed";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  )
    return "rate";
  return "credentials";
}
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
