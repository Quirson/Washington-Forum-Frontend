import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Edit3,
    Calendar,
    User,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    FileText,
    Paperclip,
    MessageSquare,
    AlertTriangle
} from "lucide-react";
import { apiClient } from "@/services/api";
import "./SubmissionDetailsPage.css";

// Página /applications/submissions/:id
// - Mostra data + status + reviewed_by + reviewed_at + notes + decision_reason
// - Mostra attachments (media_id) e linka pra /api/v1/media/:id (se existir)

const API_ORIGIN = import.meta.env.VITE_API_URL?.replace("/api/v1","") || "https://api.washingtongaming.tech";


const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
        case "approved":
        case "accepted":
            return CheckCircle;
        case "rejected":
        case "denied":
            return XCircle;
        case "under_review":
            return AlertCircle;
        case "pending":
            return Clock;
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
        case "under_review":
            return "var(--accent-blue)";
        case "pending":
            return "#eab308";
        default:
            return "var(--text-secondary)";
    }
};

export const SubmissionDetailsPage = () => {
    const { id } = useParams();

    const { data, isLoading } = useQuery({
        queryKey: ["submission", id],
        queryFn: async () => apiClient.get(`/applications/submissions/${id}`),
        enabled: !!id,
    });

    const s = data?.submission;
    const StatusIcon = s ? getStatusIcon(s.status) : FileText;
    const statusColor = s ? getStatusColor(s.status) : "var(--text-secondary)";

    return (
        <div className="submission-details-page">
            <div className="submission-details-container">
                <div className="submission-details-header">
                    <div className="submission-details-title-section">
                        <h1 className="submission-details-title">
                            {s?.template_name || "Submission"}
                        </h1>
                        <p className="submission-details-subtitle">ID: {id}</p>
                    </div>

                    <div className="submission-details-actions">
                        <Link className="btn-ghost submission-details-btn" to="/applications/my">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">My submissions</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                        {s?.can_review && (
                            <Link className="btn-primary submission-details-btn" to={`/applications/reviews/submissions/${id}`}>
                                <Edit3 size={18} />
                                Review
                            </Link>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="submission-details-card">
                        <div className="submission-details-loading">
                            <div className="spinner"></div>
                            <span>Loading submission...</span>
                        </div>
                    </div>
                ) : !s ? (
                    <div className="submission-details-card">
                        <div className="submission-details-error">
                            <AlertTriangle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
                            <h2 className="submission-details-error-title">Submission not found</h2>
                            <p className="submission-details-error-text">
                                The submission you're looking for doesn't exist or has been removed.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="submission-details-content">
                        {/* Status Card */}
                        <div className="submission-status-card">
                            <div className="submission-status-header">
                                <StatusIcon size={24} style={{ color: statusColor }} />
                                <div>
                                    <div className="submission-status-label">Status</div>
                                    <div
                                        className="submission-status-value"
                                        style={{ color: statusColor }}
                                    >
                                        {s.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="submission-info-grid">
                            <div className="submission-info-card">
                                <Calendar size={20} className="submission-info-icon" />
                                <div className="submission-info-content">
                                    <div className="submission-info-label">Created</div>
                                    <div className="submission-info-value">{s.created_at}</div>
                                </div>
                            </div>

                            <div className="submission-info-card">
                                <Calendar size={20} className="submission-info-icon" />
                                <div className="submission-info-content">
                                    <div className="submission-info-label">Reviewed</div>
                                    <div className="submission-info-value">{s.reviewed_at || "—"}</div>
                                </div>
                            </div>

                            <div className="submission-info-card">
                                <User size={20} className="submission-info-icon" />
                                <div className="submission-info-content">
                                    <div className="submission-info-label">Reviewed by</div>
                                    <div className="submission-info-value">
                                        {s.reviewed_by_user?.username || s.reviewed_by || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Review Notes */}
                        {s.review_notes && (
                            <div className="submission-section">
                                <div className="submission-section-header">
                                    <MessageSquare size={20} />
                                    <span>Review Notes</span>
                                </div>
                                <div className="submission-section-content">
                                    {s.review_notes}
                                </div>
                            </div>
                        )}

                        {/* Decision Reason */}
                        {s.decision_reason && (
                            <div className="submission-section submission-section-warning">
                                <div className="submission-section-header">
                                    <AlertTriangle size={20} />
                                    <span>Decision Reason</span>
                                </div>
                                <div className="submission-section-content">
                                    {s.decision_reason}
                                </div>
                            </div>
                        )}

                        {/* Data Section */}
                        <div className="submission-data-section">
                            <div className="submission-section-header">
                                <FileText size={20} />
                                <span>Submission Data</span>
                            </div>
                            <div className="submission-data-form">
                                {(s.template_fields || []).map((f: any) => {
                                    const value = s.data?.[f.name];

                                    // attachments desse field (ex: "proof_image")
                                    const files = (s.attachments || []).filter((a: any) => a.field_name === f.name);

                                    // ✅ FILE FIELD: render imagens/links aqui mesmo
                                    if (f.type === "file") {
                                        return (
                                            <div key={f.name} className="submission-data-field">
                                                <div className="submission-data-label">{f.label}</div>

                                                {files.length === 0 ? (
                                                    <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                                                        No file uploaded
                                                    </div>
                                                ) : (
                                                    <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                                                        {files.map((a: any) => {
                                                            const raw = a.url || ""; // backend deve mandar /uploads/xxx.jpg
                                                            const src = raw.startsWith("http") ? raw : `${API_ORIGIN}${raw}`;
                                                            const isImg = (a.mime_type || "").startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(raw);

                                                            return (
                                                                <div key={a.id} style={{ display: "grid", gap: 8 }}>
                                                                    {isImg ? (
                                                                        <img
                                                                            src={src}
                                                                            alt={f.label}
                                                                            loading="lazy"
                                                                            style={{
                                                                                width: "100%",
                                                                                maxWidth: 520,
                                                                                borderRadius: 12,
                                                                                border: "1px solid rgba(255,255,255,0.08)",
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <a className="btn-ghost" href={src} target="_blank" rel="noreferrer">
                                                                            Open file
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // ✅ NORMAL FIELDS (text/textarea/checkbox/select)
                                    return (
                                        <div key={f.name} className="submission-data-field">
                                            <div className="submission-data-label">{f.label}</div>

                                            {f.type === "textarea" ? (
                                                <textarea className="input-field" value={value ?? ""} readOnly />
                                            ) : f.type === "checkbox" ? (
                                                <input type="checkbox" checked={!!value} readOnly />
                                            ) : (
                                                <input className="input-field" value={value ?? ""} readOnly />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Attachments */}

                    </div>
                )}
            </div>
        </div>
    );
};