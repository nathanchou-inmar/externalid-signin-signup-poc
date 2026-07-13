import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { msalInstance } from "./msalInstance";
import "./index.css";

async function startApp() {
  await msalInstance.initialize();

  const redirectResult = await msalInstance.handleRedirectPromise();

  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  } else {
    const existingAccounts = msalInstance.getAllAccounts();

    if (existingAccounts.length > 0) {
      msalInstance.setActiveAccount(existingAccounts[0]);
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

startApp().catch((error) => {
  console.error("Failed to start app", error);
});