# poc-signup

Proof of concept for **external OIDC identity provider self-service registration**. A developer-facing dashboard that uses the Microsoft Graph API to manage identity providers and attach them to a self-service sign-up user flow in Microsoft Entra External ID.

## Tech Stack

- **Frontend:** React (JSX), Vite
- **Backend:** ASP.NET Core (.NET 10), Microsoft Graph SDK, Azure Identity

## Features

| Panel | Description |
|---|---|
| Access Token | Fetches a Graph API access token via client credentials |
| List IdPs | Lists all identity providers registered in the tenant |
| Create IdP | Registers a new OIDC identity provider |
| Attach IdP to Flow | Links an existing IdP to a self-service sign-up user flow |

## How It Works

1. The .NET server authenticates to Microsoft Graph using client credentials (`ClientSecretCredential`).
2. The frontend calls the backend REST API (`/api/token`, `/api/idps`, `/api/userflows/{flowId}/idps/{idpId}`) to perform Graph operations.
3. A newly registered OIDC provider can be attached to a user flow by ID.

## Setup

### Backend Environment Variables

Create `server/.env`:

```
TENANT_ID=<your tenant id>
GRAPH_CLIENT_ID=<app registration client id>
GRAPH_CLIENT_SECRET=<app registration client secret>
```

The app registration must have the `IdentityProvider.ReadWrite.All` and `EventListener.ReadWrite.All` Microsoft Graph application permissions.

### Frontend Environment Variables

Create `client/.env`:

```
VITE_USER_FLOW_ID=<default user flow id>
```

### Run

**Backend:**

```bash
cd server
dotnet run
```

**Frontend** (in a separate terminal):

```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to the .NET backend.
