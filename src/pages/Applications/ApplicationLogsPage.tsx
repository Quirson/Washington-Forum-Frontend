import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { apiClient } from "@/services/api";
import "./ApplicationPublicLogsPage.css";

// Página /applications/:code/logs
// Lista submissões públicas de um template (endpoint já existe: /applications/public/:code/submissions)

export const ApplicationPublicLogsPage = () => {
    const { code } = useParams();

    const { data, isLoading } = useQuery({
        queryKey: ["public-submissions", code],
        queryFn: async () => {
            const res = await apiClient.get(`/applications/public/${code}/submissions?page=1&limit=25`);
            return res;
        },
        enabled: !!code,
    });

    const submissions = data?.submissions || [];
    const template = data?.template;

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

    return (
        <div className="logs-page">
            <div className="logs-container">
                <div className="logs-header">
                    <div className="logs-title-section">
                        <h1 className="logs-title">
                            {template?.name || "Logs"}
                        </h1>
                        <p className="logs-subtitle">
                            Public submissions ({data?.pagination?.total ?? 0})
                        </p>
                    </div>

                    <div className="logs-actions">
                        <Link className="btn-ghost logs-btn" to="/applications">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">Forms</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                        {code && (
                            <Link className="btn-primary logs-btn" to={`/applications/${code}`}>
                                Create
                            </Link>
                        )}
                    </div>
                </div>

                <div className="logs-card">
                    <div className="logs-card-header">
                        <FileText size={20} className="logs-header-icon" />
                        <span>Logs</span>
                    </div>

                    {isLoading ? (
                        <div className="logs-loading">
                            <div className="spinner"></div>
                            <span>Loading submissions...</span>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="logs-empty">
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                            <p>No public submissions yet.</p>
                            <p className="logs-empty-hint">Be the first to submit!</p>
                        </div>
                    ) : (
                        <div className="logs-list">
                            {submissions.map((s: any) => (
                                <Link
                                    key={s.id}
                                    to={`/applications/submissions/${s.id}`}
                                    className="log-item"
                                >
                                    <div className="log-content">
                                        <div className="log-user-info">
                                            <div className="log-username">
                                                {s.user?.username || "Unknown"}
                                            </div>
                                            <div className="log-date">
                                                {s.created_ago || s.created_at}
                                            </div>
                                        </div>

                                        <div className="log-status-wrapper">
                                            <div
                                                className="log-status"
                                                style={{
                                                    color: getStatusColor(s.status),
                                                    borderColor: getStatusColor(s.status) + "40"
                                                }}
                                            >
                                                {s.status}
                                            </div>
                                            <Eye size={18} className="log-view-icon" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination (se necessário no futuro) */}
                {data?.pagination && data.pagination.total > 25 && (
                    <div className="logs-pagination">
                        <button className="btn-ghost pagination-btn" disabled>
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {data.pagination.page || 1} of {Math.ceil(data.pagination.total / 25)}
                        </span>
                        <button className="btn-ghost pagination-btn" disabled>
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};