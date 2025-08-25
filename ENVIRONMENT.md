# Tau Centennial — Environment (Square)
Set in Netlify → Site settings → Build & deploy → Environment:

Required:
- SITE_URL = https://tau100.netlify.app
- SITE_ID = 4a380a79-5b63-4089-abb1-02b16dc792c9
- ADMIN_KEY = In5nite1914!
- SQUARE_ACCESS_TOKEN = <Square access token>
- SQUARE_LOCATION_ID = <Square location ID>
- SQUARE_WEBHOOK_SIGNATURE_KEY = <Square webhook signature key>

Webhook endpoint in Square: https://tau100.netlify.app/.netlify/functions/square_webhook
Events: payments.created, payments.updated
