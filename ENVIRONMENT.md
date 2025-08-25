# Tau Centennial — Environment & Setup (tau100.netlify.app)

## Required
- `SITE_URL` = `https://tau100.netlify.app`
- `SITE_ID` = `<copy from Netlify → Site settings → Site details → Site ID>`
- `STRIPE_SECRET_KEY` = `sk_test_...` (use test first, then live)
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Stripe for the endpoint below)
- `ADMIN_KEY` = `<choose a passcode>`

## Optional (Email confirmations)
- `POSTMARK_TOKEN` = `<Postmark server token>`
- `FROM_EMAIL`    = `noreply@tau100.netlify.app` (or your domain)

## Stripe Webhook
Endpoint: `https://tau100.netlify.app/.netlify/functions/webhook`
Events: `checkout.session.completed`

Redeploy after changes; test with Stripe test card 4242 4242 4242 4242.
