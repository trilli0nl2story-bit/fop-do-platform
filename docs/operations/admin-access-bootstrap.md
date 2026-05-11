# Admin Access Bootstrap

Date: 2026-05-11

Purpose: safely restore owner admin access without adding a public recovery page.

## When To Use

Use this only when the owner cannot access `/admin`, but the deployment can still run trusted server-side commands in Replit or on the production server.

## How The Server Script Works

The command `npm run bootstrap:admin` reads secrets from the server environment, connects directly to PostgreSQL, and creates or updates one owner account:

- sets the email from `ADMIN_BOOTSTRAP_EMAIL`;
- sets a new password from `ADMIN_BOOTSTRAP_PASSWORD`;
- marks the user as `is_admin = true`;
- marks the email as verified;
- bumps `session_version`, so old sessions for that account are invalidated;
- creates a basic profile if it is missing.

The script does not create a public website route.

## Required Temporary Secrets

Set these only for the recovery run:

```env
ADMIN_BOOTSTRAP_ENABLED=true
ADMIN_BOOTSTRAP_EMAIL=urustau@gmail.com
ADMIN_BOOTSTRAP_PASSWORD=<new strong password, 12+ characters>
ADMIN_BOOTSTRAP_TOKEN=<random 32+ character token>
ADMIN_BOOTSTRAP_NAME=Mikhail
ADMIN_BOOTSTRAP_CONFIRM=PROMOTE_OWNER_ADMIN
```

`DATABASE_URL` must also be present, as usual.

## Run In Server Shell

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

## Live Deployment Fallback

If Replit workspace and the published deployment use different environments, the local script can update the workspace database while the live site still cannot see the admin account. In that case, publish the code and call the guarded live endpoint:

```bash
node -e "fetch('https://metodcab.replit.app/api/auth/admin-bootstrap',{method:'POST',headers:{'content-type':'application/json','x-admin-bootstrap-token':process.env.ADMIN_BOOTSTRAP_TOKEN},body:JSON.stringify({confirm:'PROMOTE_OWNER_ADMIN'})}).then(async r=>{console.log(r.status); console.log(await r.text())})"
```

The endpoint returns 404 unless all of these are true in the deployment environment:

- `ADMIN_BOOTSTRAP_ENABLED=true`;
- `ADMIN_BOOTSTRAP_EMAIL` is set;
- `ADMIN_BOOTSTRAP_PASSWORD` is set and contains 12+ characters;
- `ADMIN_BOOTSTRAP_TOKEN` is set and contains 32+ characters;
- `ADMIN_BOOTSTRAP_CONFIRM=PROMOTE_OWNER_ADMIN`;
- the request sends the same token in `x-admin-bootstrap-token`.

Use this endpoint only for access recovery, then disable/remove the secrets.

## Cleanup

Immediately after success:

1. Remove `ADMIN_BOOTSTRAP_ENABLED`.
2. Remove `ADMIN_BOOTSTRAP_EMAIL`.
3. Remove `ADMIN_BOOTSTRAP_PASSWORD`.
4. Remove `ADMIN_BOOTSTRAP_TOKEN`.
5. Remove `ADMIN_BOOTSTRAP_NAME`.
6. Remove `ADMIN_BOOTSTRAP_CONFIRM`.
7. Log in with the new password.
8. Open `/admin`.

## Safety Notes

- The server script exposes no public route.
- The live endpoint returns 404 unless explicitly enabled and called with the secret token.
- Both flows refuse to run unless `ADMIN_BOOTSTRAP_ENABLED=true`.
- Both flows refuse to run unless `ADMIN_BOOTSTRAP_CONFIRM=PROMOTE_OWNER_ADMIN`.
- Passwords are hashed with bcrypt before saving.
- SQL uses parameterized values.
- This is an operational recovery tool, not a permanent login flow.
