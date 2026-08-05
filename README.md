# Team Assessment Student Page Mock

This is a first-pass mock of the student assessment page only.

It includes:

- Next.js App Router
- Tailwind CSS
- Static/mock student assessment data
- Dynamic group-size contribution allocation slider
- Auto-updating contribution table
- Weekly feedback fields
- Week navigation
- Local submission locking after submit
- Neutral theme variables in `app/globals.css`

Educator invitations can be delivered through Brevo's transactional email API. Without Brevo configuration, the invitation workflow remains in preview mode and sends no email.

## Run locally

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Brevo email integration

Create a Brevo API key and verify a sender in Brevo, then add these values to `.env`:

```bash
BREVO_API_KEY="xkeysib-..."
BREVO_SENDER_EMAIL="verified-sender@example.com"
BREVO_SENDER_NAME="PRISM"
BREVO_REPLY_TO_EMAIL="support@example.com"
APP_URL="http://localhost:3000"
```

`BREVO_API_KEY` and `BREVO_SENDER_EMAIL` enable real delivery. The sender address must be registered and verified in Brevo. Set `APP_URL` to the deployed PRISM origin in production so invitation links point to the correct login page. Never commit `.env`.

## Theme customisation

Edit the CSS variables in `app/globals.css`:

```css
:root {
  --color-primary: #31536a;
  --color-secondary: #64748b;
  --color-background: #f6f7f9;
  --color-surface: #ffffff;
  --color-text: #172033;
  --color-muted: #667085;
  --color-border: #d9dee7;
}
```
