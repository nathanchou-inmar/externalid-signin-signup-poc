import { PublicClientApplication, 
        BrowserCacheLocation,
} from "@azure/msal-browser";

import HRD from "../Scripts/hrdApi";


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

export async function sendToMicrosoft(email, domain) {
    console.log(email, domain);
    //Call HRD DB, check valid domain_hint then check IDP from graph API to send domain_hint. Else
    
    if (email.includes("@inmar.com")) {
      console.log("inside");
      await msalInstance.loginRedirect({
          scopes: loginScopes,
          loginHint: email,
          domainHint: "inmar.com"
      });
    } else {
      await msalInstance.loginRedirect({
          scopes: loginScopes,
          loginHint: email,
          domainHint: domain
      });
    }
}