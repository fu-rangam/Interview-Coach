# Development Journal & Architectural Notes

This document serves as a running journal of ideas, trade-offs, and architectural strategies discussed during development.

## [2025-12-12] Guest Access Control Strategies

### Context

We implemented a "Teaser" model where guests get 1 free session. We used a client-side "Soft Gate" (LocalStorage) which is easy to bypass via Incognito mode. We discussed a "Hard Gate" (IP Blocking) but decided against it for the MVP due to complexity and collateral damage risks.

### Strategy: Strict IP Blocking (Hard Gate)

If we need to prevent "serial free-loaders" in the future, we can move the gatekeeper logic to the server.

#### Architecture

Use **Supabase Edge Functions** to intercept requests before they allow access to the interview loop.

1.  **Database Schema**
    Create a tracking table for IP addresses.

    ```sql
    create table guest_access_logs (
      id uuid default gen_random_uuid() primary key,
      ip_address text not null,
      created_at timestamp with time zone default now()
    );
    -- Index for fast lookups
    create index idx_guest_ip on guest_access_logs(ip_address);
    ```

2.  **Edge Function (The Gatekeeper)**
    A serverless function (TypeScript) hosted on Supabase.
    - **Logic:**
      1.  Extract `x-forwarded-for` header (User IP).
      2.  Check `guest_access_logs` for this IP in the last 24 hours.
      3.  If found: Return `403 Forbidden`.
      4.  If not found: Insert IP -> Return `200 OK`.

3.  **Frontend Integration**
    Update `RoleSelection.tsx` (or `Home.tsx`) to call this function before allowing the user to proceed.
    ```typescript
    const handleStart = async () => {
      const { error } = await supabase.functions.invoke('check-guest-access');
      if (error) {
        // Redirect to signup
        navigate('/auth?mode=signup');
      } else {
        // Proceed
        navigate('/interview');
      }
    };
    ```

#### Trade-offs

- **Pros:** reliably blocks Incognito visitors and different browsers on the same machine.
- **Cons:** "Collateral Damage". Blocks all users sharing a public IP (e.g., University students, Corporate offices, Coffee shops). High false-positive rate for legitimate users in shared environments.
