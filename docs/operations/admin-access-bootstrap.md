# Admin Access Bootstrap

Date: 2026-05-11

Purpose: safely restore owner admin access without adding a public recovery page.

## When To Use

Use this only when the owner cannot access `/admin`, but the deployment can still run trusted server-side commands in Replit or on the production server.

## How It Works

The command `npm run bootstrap:admin` reads secrets from the server environment, connects directly to PostgreSQL, and creates or updates one owner account:

- sets the email from `ADMIN_BOOTSTRAP_EMAIL`;
- sets a new password from `ADMIN_BOOTSTRAP_PASSWORD`;
- marks the user as `is_admin = true`;
- marks the email as verified;
- bumps `session_version`, so old sessions for that account are invalidated;
- creates a basic profile if it is missing.

It does not create a public website route.

## Required Temporary Secrets

Set these only for the recovery run:

```env
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_BOOTSTRAP_EMAIL=urustau@gmail.com
ADMIN_BOOTSTRAP_PASSWORD=<new strong password, 12+ characters>
ADMIN_BOOTSTRAP_NAME=Михаил
ADMIN_BOOTSTRAP_CONFIRM=PROMOTE_OWNER_ADMIN
```

`DATABASE_URL` must also be present, as usual.

## Run

```bash
npm run bootstrap:admin
```

Expected success output:

```text
Admin bootstrap updated: urustau@gmail.com
User id: ...
Next: remove ADMIN_BOOTSTRAP_* secrets and sign in with the new password.
```

If the account does not exist yet, the script prints `created` instead of `updated`.

## Cleanup

Immediately after success:

1. Remove `ADMIN_BOOTSTRAP_ENABLED`.
2. Remove `ADMIN_BOOTSTRAP_EMAIL`.
3. Remove `ADMIN_BOOTSTRAP_PASSWORD`.
4. Remove `ADMIN_BOOTSTRAP_NAME`.
5. Remove `ADMIN_BOOTSTRAP_CONFIRM`.
6. Log in with the new password.
7. Open `/admin`.

## Safety Notes

- No public route is exposed.
- The script refuses to run unless `ADMIN_BOOTSTRAP_ENABLED=true`.
- The script refuses to run unless `ADMIN_BOOTSTRAP_CONFIRM=PROMOTE_OWNER_ADMIN`.
- Passwords are hashed with bcrypt before saving.
- The script uses parameterized SQL.
- This is an operational recovery tool, not a permanent login flow.
