import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export async function checkOTL() {
    console.count("PrivateSignUpPage render");
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    console.log(token);
    const response = await fetch("/api/checkOTL", {
        method: "POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            token: token
        })
    })
    return response;
}

function Signup() {
    const navigate = useNavigate();

    useEffect(() => {
        async function run(){
            const response = await checkOTL();
            if (!response.ok) {
                navigate("/transition");
            }
        }
        run();
    }, [])

    const [entries, setEntries] = useState({
        displayName: "",
        domain: "",
        endpoint: "",
        clientId: "",
        clientSecret: ""
    });

    function handleChange(e) {
        setEntries(values => ({...values, [e.target.name]: e.target.value}));
    }

    const [responseMessage, setResponseMessage] = useState();
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setEntries({
            displayName: "",
            domain: "",
            endpoint: "",
            clientId: "",
            clientSecret: ""
        })
        setResponseMessage("loading");
        console.log("submitted: ", entries);
        const output = await fetch("/api/oidc", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entries)
        });
        
        setLoading(false);

        var response = await output.json();

        if (!output.ok) {
            console.log("problem: ", response.detail);
            setResponseMessage(`problem: ${response.detail}`);
        } else {
            console.log("done: ", response.id);
            setResponseMessage(`completed: ${response.id}`);
        }
    }

    const [message, setMessage] = useState("Press me");
    async function apiTest(e) {
        console.log("API button pressed");
        const response = await fetch("/api/HelloWorld", {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                message: "HI"
            })
        });
        
        if (!response.ok) {
            console.log("bad", response.statusText);
            throw Error("Something went wrong");
        }

        const output = (await response.json()).output;
        console.log(output);
        setMessage(output);
    }
    return(
        <div>
            <p>{responseMessage}</p>
            <form onSubmit={handleSubmit}>
               <label> Display Name:
                <input
                    type="text"
                    name="displayName"
                    value={entries.displayName}
                    onChange={handleChange}
                    required
                />
               </label>
               <label> Domain:
                <input
                    type="text"
                    name="domain"
                    value={entries.domain}
                    onChange={handleChange}
                    required
                />
               </label>
               <label> Well-Known Endpoint:
                <input
                    type="text"
                    name="endpoint"
                    value={entries.endpoint}
                    onChange={handleChange}
                    required
                />
               </label>
               <label> Client Id:
                <input
                    type="text"
                    name="clientId"
                    value={entries.clientId}
                    onChange={handleChange}
                    required
                    />
                </label>
               <label> Client Secret:
                <input
                    type="text"
                    name="clientSecret"
                    value={entries.clientSecret}
                    onChange={handleChange}
                    required
                />
               </label>
                <button id="submit" type="submit" disabled={loading}>
                {loading ? "Loading" : "Submit"}
                </button>
            </form>
        </div>
    )
}

export default Signup;