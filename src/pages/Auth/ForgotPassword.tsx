import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { Link } from "react-router-dom";

type FormData = { email: string };

export const ForgotPassword = () => {
    const { register, handleSubmit } = useForm<FormData>();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: FormData) => {
        try {
            setLoading(true);
            await authService.forgotPassword(data.email);
            toast.success("If this email exists, we sent a reset link.");
        } catch (e: any) {
            toast.error(e?.response?.data?.error || e?.message || "Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 520, background: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
                <h1 style={{ fontSize: 22, marginBottom: 8 }}>Forgot password</h1>
                <p style={{ color: "#aaa", marginBottom: 16 }}>Enter your email and we’ll send a reset link.</p>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 12 }}>
                    <input
                        {...register("email")}
                        type="email"
                        placeholder="your@email.com"
                        style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: 12, borderRadius: 10, border: "none", background: "#0ea5e9", color: "#fff", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                </form>

                <div style={{ marginTop: 16 }}>
                    <Link to="/login" style={{ color: "#0ea5e9", textDecoration: "none" }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};
