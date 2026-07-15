# poc-combined

Combined proof of concept that merges **HRD-based sign-in** and **OIDC provider self-service sign-up** into a single multi-page application.

## Tech Stack

- **Frontend:** React (JSX), React Router, Vite, `@azure/msal-browser`
- **Backend:** ASP.NET Core (.NET 10), Microsoft Graph Beta SDK, Azure Identity

## Pages

| Route | Description |
|---|---|
| `/` | Home — redirects to sign-in if no active MSAL account |
| `/Signin` | HRD sign-in — discovers the user's IdP then redirects via MSAL |
| `/Signup` | OIDC provider registration — validates a one-time-link token, then collects and registers a new OIDC provider |
| `/transition` | Fallback shown when a sign-up link is invalid or expired |

## How It Works

### Sign-in Flow
1. User enters their email on `/Signin`.
2. The app queries Microsoft's `RealmDiscovery/HomeRealm` endpoint to identify the IdP.
3. MSAL's `loginRedirect` is called with `loginHint` (email) and `domainHint` (domain), routing to the correct provider.

### Sign-up Flow
1. User arrives at `/Signup` with an `?invite=<token>` query parameter.
2. The backend validates the one-time-link token (`POST /api/checkOTL`).
3. On success, the user fills out an OIDC provider form (display name, domain, endpoint, client ID/secret).
4. The backend registers the OIDC provider via Microsoft Graph and attaches it to the configured user flow.

## Setup

### Frontend Environment Variables

Create `client/.env`:

```
VITE_ENTRA_CLIENT_ID=<your app client id>
VITE_ENTRA_TENANT_ID=<your tenant id>
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
```

### Backend Environment Variables

Create `hrdServer/.env`:

```
TENANT_ID=<your tenant id>
GRAPH_CLIENT_ID=<app registration client id>
GRAPH_CLIENT_SECRET=<app registration client secret>
USER_FLOW_ID=<self-service sign-up user flow id>
```

The app registration must have the `IdentityProvider.ReadWrite.All` and `EventListener.ReadWrite.All` Microsoft Graph application permissions.

### Run

**Backend:**

```bash
cd hrdServer
dotnet run
```

**Frontend** (in a separate terminal):

```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to the .NET backend.