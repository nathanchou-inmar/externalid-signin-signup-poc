import {useState} from 'react'
import HRD from "./hrdApi"
import { sendToMicrosoft } from './msalInstance';


function App() {
  const [email, setEmail] = useState("");
  const [_, setResponse] = useState("Loading")
  const [loading, setLoading] = useState(false);

  var blank = email.trim() === "";

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailHint = email;
    setEmail("");
    if (loading || blank) return;
    try {
      setLoading(true);
      const hrdResponse = await HRD(email);
      setResponse(hrdResponse);
      await sendToMicrosoft(emailHint, hrdResponse);
    }
    catch (e) {
      console.log("exception: ", e);
    }
    finally {
      setLoading(false);
    }
  }

  return (
    <div className="entry">
      <h2 className="intro heading-xl">
        Welcome, log in to InmarOne EEID POC
      </h2>
      <p className="description">
        Enter your email to access insights and your healthcare tools.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="entry-item">
          <label htmlFor="signInName">Email Address</label>
          <input
            id="signInName"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="buttons">
          <button id="continue" type="submit" disabled={loading || blank}>
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default App