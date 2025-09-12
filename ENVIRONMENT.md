# Tau Centennial — Environment (Manual Payment Gate + Tiers)

Set these in Netlify → Site settings → Build & deploy → Environment:

Required
- SITE_URL = https://tau100.netlify.app
- SITE_ID = 4a380a79-5b63-4089-abb1-02b16dc792c9
- ADMIN_KEY = In5nite1914!

Optional
- POSTMARK_TOKEN, FROM_EMAIL (if you want to email confirm links)

Functions
- submit_manual_registration → creates PENDING record and returns paymentCode + confirmUrl
- confirm_payment → promotes PENDING to registrants (verification:"self")
- list_pending / approve_pending / deny_pending → admin queue
- list_registrants → drives public roster
- export_csv → CSV with package columns + totals in Admin panel
