# Sunroad

A platform for artists and creative institutions to connect, showcase work, and discover opportunities.

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Backend:** [Supabase](https://supabase.com/) (Auth, Database, Storage, Realtime)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Security:** Cloudflare Turnstile (CAPTCHA)


## Features

- **Authentication:** OTP-first login (Passwordless entry -> Password protection).
- **Onboarding:** Multi-step wizard with real-time handle validation and profile creation.
- **Security:** - RLS (Row Level Security) enabled on all database tables.
  - CAPTCHA protection on public auth endpoints.
  - RPC-based atomic transactions for critical actions.
- **Location Services:** Integrated city search and geolocation.

## Getting Started Locally

1. **Clone the repository**

   ```bash
   git clone [https://github.com/your-username/sunroad.git](https://github.com/your-username/sunroad.git)
   cd sunroad