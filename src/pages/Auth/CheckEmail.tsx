import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

export const CheckEmail = () => {
    const [params] = useSearchParams();
    const email = useMemo(() => params.get("email") || "", [params]);
    const [loading, setLoading] = useState(false);

    const handleResend = async () => {
        if (!email) return toast.error("Missing email");
        try {
            setLoading(true);
            await authService.resendVerification(email);
            toast.success("Verification email sent (if the account exists).");
        } catch (e: any) {
            toast.error(e?.response?.data?.error || e?.message || "Failed to resend");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 520, background: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
                <h1 style={{ fontSize: 22, marginBottom: 8 }}>Verify your email</h1>
                <p style={{ color: "#aaa", marginBottom: 16 }}>
                    We sent a verification link to: <b style={{ color: "#fff" }}>{email || "your email"}</b>
                </p>

                <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                        color: "#fff",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Sending..." : "Resend verification email"}
                </button>

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>Go to Login</Link>
                    <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Back Home</Link>
                </div>
            </div>
        </div>
    );
};