import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

export const VerifyEmail = () => {
    const [params] = useSearchParams();
    const token = useMemo(() => params.get("token") || "", [params]);

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("Verifying...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Missing token.");
            return;
        }

        (async () => {
            try {
                await authService.verifyEmail(token);
                setStatus("success");
                setMessage("Email verified successfully!");
                toast.success("Email verified!");
            } catch (e: any) {
                setStatus("error");
                setMessage(e?.response?.data?.error || e?.message || "Verification failed");
                toast.error("Verification failed");
            }
        })();
    }, [token]);

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 520, background: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
                <h1 style={{ fontSize: 22, marginBottom: 8 }}>Email verification</h1>
                <p style={{ color: status === "success" ? "#00ff7f" : status === "error" ? "#ef4444" : "#aaa" }}>
                    {message}
                </p>

                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>Go to Login</Link>
                    <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Back Home</Link>
                </div>
            </div>
        </div>
    );
};
