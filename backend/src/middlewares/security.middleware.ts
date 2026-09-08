import { Request, Response, NextFunction } from "express";

/**
 * Dependency-free security headers (helmet-equivalent for a JSON API). These are
 * the response headers a browser honors. The app-level CSP/HSTS for HTML pages
 * belongs on the CDN/edge; here we lock the API surface down.
 *
 * Note: `Cross-Origin-Resource-Policy` is intentionally NOT set to `same-site`
 * so the frontend can still load `/uploads/*` images cross-origin.
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  // JSON/asset API — no document ever loads sub-resources from here.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
  // HSTS only over TLS (behind a proxy, trust X-Forwarded-Proto).
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }
  next();
};
