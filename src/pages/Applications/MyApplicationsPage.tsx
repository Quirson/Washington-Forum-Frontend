import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import { apiClient } from "@/services/api";
import "./MyApplicationsPage.css";

// Página /applications/my
// Lista submissões do user logado (endpoint: /applications/submissions)

const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
        case "approved":
        case "accepted":
            return CheckCircle;
        case "rejected":
        case "denied":
            return XCircle;
        case "pending":
            return Clock;
        case "reviewing":
            return AlertCircle;
        default:
            return FileText;
    }
};

const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
        case "approved":
        case "accepted":
            return "var(--color-verified)";
        case "rejected":
        case "denied":
            return "#ef4444";
        case "pending":
            return "#eab308";
        case "reviewing":
            return "var(--accent-blue)";
        default:
            return "var(--text-secondary)";
    }
};

export const MyApplicationsPage = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["my-submissions"],
        queryFn: async () => apiClient.get("/applications/submissions?page=1&limit=50"),
    });

    const submissions = data?.submissions || [];
    const total = data?.pagination?.total ?? submissions.length;

    return (
        <div className="my-apps-page">
            <div className="my-apps-container">
                <div className="my-apps-header">
                    <div className="my-apps-title-section">
                        <h1 className="my-apps-title">My Applications</h1>
                        <p className="my-apps-subtitle">
                            {total} {total === 1 ? "application" : "applications"} total
                        </p>
                    </div>

                    <div className="my-apps-actions">
                        <Link className="btn-ghost my-apps-btn" to="/applications">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">Forms</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                    </div>
                </div>

                <div className="my-apps-card">
                    {isLoading ? (
                        <div className="my-apps-loading">
                            <div className="spinner"></div>
                            <span>Loading your applications...</span>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="my-apps-empty">
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                            <p className="my-apps-empty-title">No applications yet</p>
                            <p className="my-apps-empty-text">
                                You haven't submitted any applications. Start by creating one!
                            </p>
                            <Link className="btn-primary my-apps-empty-btn" to="/applications">
                                Browse Forms
                            </Link>
                        </div>
                    ) : (
                        <div className="my-apps-list">
                            {submissions.map((s: any) => {
                                const StatusIcon = getStatusIcon(s.status);
                                const statusColor = getStatusColor(s.status);

                                return (
                                    <Link
                                        key={s.id}
                                        to={`/applications/submissions/${s.id}`}
                                        className="my-app-item"
                                    >
                                        <div className="my-app-content">
                                            <div className="my-app-icon-wrapper">
                                                <div className="my-app-icon">
                                                    <FileText size={20} />
                                                </div>
                                            </div>

                                            <div className="my-app-info">
                                                <h3 className="my-app-name">
                                                    {s.template_name}
                                                </h3>
                                                <p className="my-app-date">
                                                    {s.created_ago || s.created_at}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="my-app-status-wrapper">
                                            <div
                                                className="my-app-status"
                                                style={{
                                                    color: statusColor,
                                                    borderColor: statusColor + "40",
                                                }}
                                            >
                                                <StatusIcon size={14} />
                                                <span>{s.status}</span>
                                            </div>
                                            <Eye size={18} className="my-app-view-icon" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Stats Summary */}
                {submissions.length > 0 && (
                    <div className="my-apps-stats">
                        <div className="my-apps-stat">
                            <div className="my-apps-stat-value">{total}</div>
                            <div className="my-apps-stat-label">Total</div>
                        </div>
                        <div className="my-apps-stat">
                            <div
                                className="my-apps-stat-value"
                                style={{ color: "#eab308" }}
                            >
                                {submissions.filter((s: any) => s.status?.toLowerCase() === "pending").length}
                            </div>
                            <div className="my-apps-stat-label">Pending</div>
                        </div>
                        <div className="my-apps-stat">
                            <div
                                className="my-apps-stat-value"
                                style={{ color: "var(--color-verified)" }}
                            >
                                {submissions.filter((s: any) =>
                                    s.status?.toLowerCase() === "approved" ||
                                    s.status?.toLowerCase() === "accepted"
                                ).length}
                            </div>
                            <div className="my-apps-stat-label">Approved</div>
                        </div>
                        <div className="my-apps-stat">
                            <div
                                className="my-apps-stat-value"
                                style={{ color: "#ef4444" }}
                            >
                                {submissions.filter((s: any) =>
                                    s.status?.toLowerCase() === "rejected" ||
                                    s.status?.toLowerCase() === "denied"
                                ).length}
                            </div>
                            <div className="my-apps-stat-label">Rejected</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};