# poc-hrd

Proof of concept for **Home Realm Discovery (HRD)**. The user enters their email address, the app queries Microsoft's HRD API to identify which Identity Provider (IdP) the account belongs to, then redirects them to Microsoft Entra ID via MSAL for authentication.

## Tech Stack

- **Frontend:** React + TypeScript, Vite
- **Auth:** `@azure/msal-browser`

## How It Works

1. User enters their email address.
2. The app posts to Microsoft's `RealmDiscovery/HomeRealm` endpoint to get the IdP for that email.
3. MSAL's `loginRedirect` is called with the email as `loginHint` and the discovered IdP as `domainHint`, routing the user to the correct identity provider.

## Setup

### Environment Variables

Create `client/.env`:

```
VITE_ENTRA_CLIENT_ID=<your app client id>
VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
```

### Run

```bash
cd client
npm install
npm run dev
```
