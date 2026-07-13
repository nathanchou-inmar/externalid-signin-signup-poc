import { useState, useEffect } from 'react'
import { msalInstance, sendToMicrosoft } from '../Scripts/msalInstance';
import { useNavigate } from 'react-router-dom';
import HRD from "../Scripts/hrdApi";


function Signin() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const isLoggedIn = msalInstance.getActiveAccount();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoggedIn) {
            navigate("/");
        }
    }, [isLoggedIn, navigate]);

    var blank = email.trim() === "";

    async function handleSubmit(event) {
        event.preventDefault();
        const emailHint = email;
        var domainHint = emailHint.split("@")[1]
        setEmail("");
        if (loading || blank) return;
        try {
            setLoading(true);
            const hrdResponse = await HRD(email);
            console.log("hrd response: ", hrdResponse);
            if (hrdResponse == "none") {
                console.log("response is none");
            }
            console.log("domain? : ", domainHint)
            await sendToMicrosoft(emailHint, domainHint);
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

export default Signin;