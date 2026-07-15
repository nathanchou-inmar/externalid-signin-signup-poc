
# hrd

A collection of proof-of-concept projects exploring **Home Realm Discovery (HRD)** and **external OIDC identity provider registration** with Microsoft Entra External ID.

## Projects

| Folder | Description |
|---|---|
| [`poc-hrd`](poc-hrd/README.md) | Frontend-only HRD proof of concept — discovers a user's IdP from their email and redirects via MSAL |
| [`poc-signup`](poc-signup/README.md) | Developer dashboard for registering and attaching OIDC identity providers via the Microsoft Graph API |
| [`poc-combined`](poc-combined/README.md) | Combined app with HRD sign-in and OIDC provider self-service sign-up in a single multi-page React app |

## Common Environment Variables

Most projects require an app registration in Microsoft Entra with the following credentials:

| Variable | Description |
|---|---|
| `VITE_ENTRA_CLIENT_ID` | Client ID of the Entra app registration (frontend) |
| `VITE_ENTRA_TENANT_ID` | Tenant ID |
| `VITE_ENTRA_AUTHORITY` | MSAL authority URL, e.g. `https://login.microsoftonline.com/<tenant-id>` |
| `TENANT_ID` | Tenant ID (backend) |
| `GRAPH_CLIENT_ID` | Client ID for Microsoft Graph calls |
| `GRAPH_CLIENT_SECRET` | Client secret for Microsoft Graph calls |

See each project's README for its specific setup and run instructions.
