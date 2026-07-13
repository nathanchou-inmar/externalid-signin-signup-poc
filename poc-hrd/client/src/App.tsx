import {useState} from 'react'
import HRD from "./hrdApi"
import { msalInstance, sendToMicrosoft } from './msalInstance';


function App() {
  const [email, setEmail] = useState("");
  const [response, setResponse] = useState("Loading")
  const [loading, setLoading] = useState(false);

  var blank = email.trim() === "";

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailHint = email;
    setEmail("");
    console.log("hello");
    if (loading || blank) return;
    try {
      setLoading(true);
      const hrdResponse = await HRD(email);
      setResponse(hrdResponse);
      await sendToMicrosoft(emailHint, hrdResponse);
    }
    catch (e) {
      console.log("marc cooked me", e);
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>
        sign in 
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type = "email"
          value = {email}
          onChange = {(event) => setEmail(event.target.value)}
        />
        <input type = "submit" disabled={loading || blank}/>
      </form>
      <pre>IDP: {response}</pre>
    </main>
  );
}

export default App