import Stripe from "stripe";

// STRIPE_SECRET_KEY is only set once the site owner creates a Stripe account
// and adds it as an environment variable. Kept optional so the rest of the
// app (and the build) never crashes when it's missing — /api/checkout just
// reports the feature as unavailable until it's configured.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-08-26.dahlia" })
  : null;
