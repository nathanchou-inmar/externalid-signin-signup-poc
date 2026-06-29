import { PublicClientApplication, 
        BrowserCacheLocation,
} from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const authority = import.meta.env.VITE_ENTRA_AUTHORITY;

const msalConfig = {
  auth: {
    clientId,
    authority,
    redirectUri: window.location.origin + "/"
  },
  cache: {
    cacheLocation: BrowserCacheLocation.SessionStorage
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);
const loginScopes = ["openid", "profile", "email"];

export async function sendToMicrosoft(email) {
    console.log("sent: ", msalInstance);
    console.log(email, "\nhint: ", hint);
    await msalInstance.loginRedirect({
        scopes: loginScopes,
        loginHint: email
    });
}