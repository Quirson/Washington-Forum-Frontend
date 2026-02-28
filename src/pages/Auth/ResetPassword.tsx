import { useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

export const ResetPassword = () => {
    const [params] = useSearchParams();
    const token = useMemo(() => params.get("token") || "", [params]);
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!token) return toast.error("Missing token");
        if (password.length < 6) return toast.error("Password must be at least 6 chars");
        if (password !== confirm) return toast.error("Passwords do not match");

        try {
            setLoading(true);
            await authService.resetPassword(token, password);
            toast.success("Password updated! Please login.");
            setTimeout(() => navigate("/login"), 200);
        } catch (e: any) {
            toast.error(e?.response?.data?.error || e?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 520, background: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
                <h1 style={{ fontSize: 22, marginBottom: 8 }}>Reset password</h1>

                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="New password"
                        style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                    />
                    <input
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        type="password"
                        placeholder="Confirm new password"
                        style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                    />

                    <button
                        onClick={submit}
                        disabled={loading}
                        style={{ padding: 12, borderRadius: 10, border: "none", background: "#10b981", color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? "Saving..." : "Save new password"}
                    </button>
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>Go to Login</Link>
                    <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Back Home</Link>
                </div>
            </div>
        </div>
    );
};