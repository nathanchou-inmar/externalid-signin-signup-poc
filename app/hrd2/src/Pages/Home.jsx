import { msalInstance } from "../Scripts/msalInstance";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Home() {
    const isLoggedIn = msalInstance.getActiveAccount();
    const navigate = useNavigate();
    useEffect(() => {
        if (!isLoggedIn) {
            navigate("/signin");
        }
    }, [isLoggedIn, navigate]);
    return (
        <div>
            <p className="description">you're logged in!</p>
        </div>
    );
}