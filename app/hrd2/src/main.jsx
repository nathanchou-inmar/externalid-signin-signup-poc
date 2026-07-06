import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { msalInstance } from './Scripts/msalInstance.js'
import './index.css'
import App from './App.jsx'

async function startApp() {
  await msalInstance.initialize();

  const redirectResult = await msalInstance.handleRedirectPromise();

  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
  }

  const mountNode =
    document.getElementById("root") ?? document.getElementById("api");

  createRoot(document.getElementById('root')).render(
    <App />
  )
}

startApp().catch((error) => {
  console.error("Failed to start app", error);
});