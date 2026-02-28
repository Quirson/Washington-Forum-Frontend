import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Eye,
    FileText,
    User,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Paperclip,
    Save,
    ShieldAlert,
    ExternalLink,
} from "lucide-react";
import { apiClient } from "@/services/api";
import "./ReviewSubmissionPage.css";

/**
 * Página /applications/reviews/submissions/:id
 * - Mostra tudo do submission
 * - Permite mudar status: pending/under_review/approved/rejected
 * - Permite review_notes + decision_reason (pra rejected)
 * - Renderiza os fields bonitos (NÃO JSON)
 * - Renderiza attachments como imagens (quando possível)
 */

const STATUS = ["pending", "under_review", "approved", "rejected"] as const;

type TemplateField = {
    name: string;
    type: "text" | "textarea" | "select" | "checkbox" | "file";
    label: string;
    required: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
};

type SubmissionAttachment = {
    id: string;
    media_id: string;
    field_name: string;
    created_at?: string;
    url?: string; // ✅ backend deve enviar
    mime_type?: string; // ✅ opcional
};

type Submission = {
    id: string;
    template_id: string;
    template_code?: string; // ✅ backend deve enviar
    template_name: string;
    is_public: boolean;
    user: { id: string; username: string; avatar?: string };
    status: string;
    data: Record<string, any>;
    attachments: SubmissionAttachment[];
    created_at: string;
    reviewed_at?: string | null;
    review_notes?: string;
    decision_reason?: string;
    reviewed_by?: string | null; // legacy
    reviewed_by_user?: { id: string; username: string; avatar?: string } | null; // ✅ backend deve enviar
    can_review: boolean;
    // ✅ opcional: backend pode mandar os fields do template já resolvidos
    template_fields?: TemplateField[];
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "approved":
            return CheckCircle;
        case "rejected":
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
    switch (status) {
        case "approved":
            return "var(--color-verified)";
        case "rejected":
            return "#ef4444";
        case "under_review":
            return "var(--accent-blue)";
        case "pending":
            return "#eab308";
        default:
            return "var(--text-secondary)";
    }
};

const humanStatus = (st: string) => st.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

function valueToText(v: any) {
    if (v === null || v === undefined) return "";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v;
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

function isImageMime(mime?: string) {
    return typeof mime === "string" && mime.startsWith("image/");
}

function looksLikeImageUrl(url?: string) {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.endsWith(".png") || u.endsWith(".jpg") || u.endsWith(".jpeg") || u.endsWith(".webp") || u.startsWith("data:image/");
}

function getAbsoluteUrl(url?: string) {
    if (!url) return "";
    // se já for absolute
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    // senão, deixa relativo (apiClient já usa baseURL, mas <img> não)
    const base = (import.meta as any).env?.VITE_API_URL
        ? String((import.meta as any).env.VITE_API_URL).replace("/api/v1", "")
        : "https://api.washingtongaming.tech";
    return base.replace(/\/$/, "") + url;
}

function FieldPreview({ field, value }: { field: TemplateField; value: any }) {
    // render bonito (read-only)
    if (field.type === "textarea") {
        return (
            <div className="review-field review-field-full">
                <label className="review-label">{field.label}</label>
                <textarea className="input-field review-textarea" value={valueToText(value)} readOnly />
            </div>
        );
    }

    if (field.type === "checkbox") {
        return (
            <div className="review-field">
                <label className="review-label">{field.label}</label>
                <div className="review-checkbox-preview">
                    <span className="review-checkbox-pill">{value ? "Yes" : "No"}</span>
                </div>
            </div>
        );
    }

    if (field.type === "select") {
        const selected = (field.options || []).find((o) => o.value === value);
        return (
            <div className="review-field">
                <label className="review-label">{field.label}</label>
                <input className="input-field" value={selected?.label || valueToText(value)} readOnly />
            </div>
        );
    }

    if (field.type === "file") {
        // file é renderizado na secção de attachments
        return null;
    }

    return (
        <div className="review-field">
            <label className="review-label">{field.label}</label>
            <input className="input-field" value={valueToText(value)} readOnly />
        </div>
    );
}

function AttachmentPreview({ a }: { a: SubmissionAttachment }) {
    const url = getAbsoluteUrl(a.url);
    const canImg = isImageMime(a.mime_type) || looksLikeImageUrl(url);

    return (
        <div className="review-attachment-item">
            <div className="review-attachment-top">
                <Paperclip size={16} className="review-attachment-icon" />
                <div className="review-attachment-info">
                    <div className="review-attachment-name">{a.field_name}</div>
                    <div className="review-attachment-id">Media: {a.media_id}</div>
                </div>

                {url ? (
                    <a className="review-attachment-open" href={url} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                    </a>
                ) : null}
            </div>

            {canImg && url ? (
                <div className="review-attachment-thumb">
                    <img src={url} alt={a.field_name} loading="lazy" />
                </div>
            ) : (
                <div className="review-attachment-no-preview">No preview</div>
            )}
        </div>
    );
}

export const ReviewSubmissionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["submission", id],
        queryFn: async () => apiClient.get(`/applications/submissions/${id}`),
        enabled: !!id,
    });

    const s: Submission | undefined = data?.submission;

    // ✅ buscar templates só se backend ainda não manda template_fields
    const { data: templatesData } = useQuery({
        queryKey: ["application-templates"],
        queryFn: async () => {
            const res = await apiClient.get("/applications/templates");
            const templates = Array.isArray(res) ? res : res?.templates;
            return templates || [];
        },
        enabled: !!s && !s?.template_fields,
    });

    const templateFields: TemplateField[] = useMemo(() => {
        if (!s) return [];
        if (Array.isArray(s.template_fields) && s.template_fields.length > 0) return s.template_fields;

        // fallback: achar pelo template_code (se backend enviar) ou pelo name
        const list = templatesData || [];
        const t = s.template_code ? list.find((x: any) => x.code === s.template_code) : list.find((x: any) => x.name === s.template_name);
        return (t?.fields || []) as TemplateField[];
    }, [s, templatesData]);

    const [status, setStatus] = useState<string>("under_review");
    const [reviewNotes, setReviewNotes] = useState<string>("");
    const [decisionReason, setDecisionReason] = useState<string>("");

    useEffect(() => {
        if (!s) return;
        setStatus(s.status || "under_review");
        setReviewNotes(s.review_notes || "");
        setDecisionReason(s.decision_reason || "");
    }, [s]);

    const reviewMutation = useMutation({
        mutationFn: async () => {
            if (!id) throw new Error("Missing id");
            return apiClient.post(`/applications/submissions/${id}/review`, {
                status,
                review_notes: reviewNotes,
                decision_reason: decisionReason,
            });
        },
        onSuccess: async () => {
            toast.success("Review saved");
            await refetch();
            navigate(`/applications/submissions/${id}`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || err?.message || "Review failed");
        },
    });

    const StatusIcon = getStatusIcon(status);
    const statusColor = getStatusColor(status);

    // attachments agrupados por field
    const attachmentsByField = useMemo(() => {
        const map: Record<string, SubmissionAttachment[]> = {};
        for (const a of s?.attachments || []) {
            if (!map[a.field_name]) map[a.field_name] = [];
            map[a.field_name].push(a);
        }
        return map;
    }, [s?.attachments]);

    return (
        <div className="review-submission-page">
            <div className="review-submission-container">
                <div className="review-submission-header">
                    <div className="review-submission-title-section">
                        <h1 className="review-submission-title">Review Submission</h1>
                        <p className="review-submission-subtitle">ID: {id}</p>
                    </div>

                    <div className="review-submission-actions">
                        <Link className="btn-ghost review-submission-btn" to="/applications/reviews">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">Reviews</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                        <Link className="btn-ghost review-submission-btn" to={`/applications/submissions/${id}`}>
                            <Eye size={18} className="btn-icon" />
                            View
                        </Link>
                    </div>
                </div>

                <div className="review-submission-card">
                    {isLoading ? (
                        <div className="review-submission-loading">
                            <div className="spinner"></div>
                            <span>Loading submission...</span>
                        </div>
                    ) : !s ? (
                        <div className="review-submission-error">
                            <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
                            <h2 className="review-submission-error-title">Submission not found</h2>
                            <p className="review-submission-error-text">The submission you're looking for doesn't exist or has been removed.</p>
                        </div>
                    ) : !s.can_review ? (
                        <div className="review-submission-no-access">
                            <ShieldAlert size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
                            <h2 className="review-submission-no-access-title">Access Denied</h2>
                            <p className="review-submission-no-access-text">You cannot review this submission. Your role does not have the required permissions.</p>
                        </div>
                    ) : (
                        <div className="review-submission-form">
                            {/* Submission Info */}
                            <div className="review-info-section">
                                <h3 className="review-section-title">
                                    <FileText size={20} />
                                    Submission Information
                                </h3>

                                <div className="review-info-grid">
                                    <div className="review-info-item">
                                        <FileText size={16} className="review-info-icon" />
                                        <div>
                                            <div className="review-info-label">Form</div>
                                            <div className="review-info-value">{s.template_name}</div>
                                        </div>
                                    </div>

                                    <div className="review-info-item">
                                        <User size={16} className="review-info-icon" />
                                        <div>
                                            <div className="review-info-label">Submitted by</div>
                                            <div className="review-info-value">{s.user?.username || "Unknown"}</div>
                                        </div>
                                    </div>

                                    <div className="review-info-item">
                                        <Calendar size={16} className="review-info-icon" />
                                        <div>
                                            <div className="review-info-label">Created</div>
                                            <div className="review-info-value">{s.created_at}</div>
                                        </div>
                                    </div>

                                    {/* ✅ mostrar status atual do submission */}
                                    <div className="review-info-item">
                                        <StatusIcon size={16} className="review-info-icon" style={{ color: statusColor }} />
                                        <div>
                                            <div className="review-info-label">Current Status</div>
                                            <div className="review-info-value" style={{ color: statusColor }}>{humanStatus(s.status)}</div>
                                        </div>
                                    </div>

                                    {/* ✅ reviewed by (nome) */}
                                    <div className="review-info-item">
                                        <User size={16} className="review-info-icon" />
                                        <div>
                                            <div className="review-info-label">Reviewed by</div>
                                            <div className="review-info-value">
                                                {s.reviewed_by_user?.username || (s.reviewed_by ? s.reviewed_by : "—")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-info-item">
                                        <Calendar size={16} className="review-info-icon" />
                                        <div>
                                            <div className="review-info-label">Reviewed at</div>
                                            <div className="review-info-value">{s.reviewed_at || "—"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Review Controls */}
                            <div className="review-controls-section">
                                <h3 className="review-section-title">
                                    <AlertCircle size={20} />
                                    Review Decision
                                </h3>

                                <div className="review-controls-grid">
                                    <div className="review-field">
                                        <label className="review-label">
                                            Status <span className="review-required">*</span>
                                        </label>
                                        <div className="review-status-select-wrapper">
                                            <StatusIcon size={18} style={{ color: statusColor }} />
                                            <select className="input-field review-status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                                {STATUS.map((st) => (
                                                    <option key={st} value={st}>
                                                        {humanStatus(st)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {status === "rejected" && (
                                        <div className="review-field review-field-full review-rejected-box">
                                            <label className="review-label">
                                                Decision Reason <span className="review-required">*</span>
                                            </label>
                                            <input
                                                className="input-field"
                                                value={decisionReason}
                                                onChange={(e) => setDecisionReason(e.target.value)}
                                                placeholder="E.g., Missing evidence, incomplete information..."
                                            />
                                            <div className="review-field-hint">Required when rejecting. This will be visible to the user.</div>
                                        </div>
                                    )}
                                </div>

                                <div className="review-field">
                                    <label className="review-label">Review Notes</label>
                                    <textarea
                                        className="input-field review-textarea"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Internal notes for staff..."
                                    />
                                    <div className="review-field-hint">Internal notes (staff only).</div>
                                </div>
                            </div>

                            {/* ✅ Submission Data (bonito) */}
                            <div className="review-data-section">
                                <h3 className="review-section-title">
                                    <FileText size={20} />
                                    Submission Data
                                </h3>

                                {templateFields.length === 0 ? (
                                    <div className="review-data-fallback">
                                        <div className="review-data-fallback-title">Template fields not loaded</div>
                                        <pre className="review-data-content">{JSON.stringify(s.data, null, 2)}</pre>
                                    </div>
                                ) : (
                                    <div className="review-data-grid">
                                        {templateFields
                                            .filter((f) => f.type !== "file")
                                            .map((f) => (
                                                <FieldPreview key={f.name} field={f} value={s.data?.[f.name]} />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* ✅ Attachments com preview */}
                            <div className="review-attachments-section">
                                <h3 className="review-section-title">
                                    <Paperclip size={20} />
                                    Attachments
                                    <span className="review-attachments-count">{s.attachments?.length || 0}</span>
                                </h3>

                                {(!s.attachments || s.attachments.length === 0) ? (
                                    <div className="review-attachments-empty">No attachments provided</div>
                                ) : (
                                    <div className="review-attachments-grid">
                                        {/* tenta respeitar a ordem dos fields do template */}
                                        {(templateFields.filter((f) => f.type === "file").map((f) => f.name) as string[])
                                            .flatMap((fieldName) => attachmentsByField[fieldName] || [])
                                            .concat(
                                                // anexos que não batem em nenhum field (fallback)
                                                (s.attachments || []).filter((a) => !templateFields.some((f) => f.name === a.field_name))
                                            )
                                            .map((a) => (
                                                <AttachmentPreview key={a.id} a={a} />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="review-submit-section">
                                <button
                                    className="btn-primary review-submit-btn"
                                    type="button"
                                    disabled={reviewMutation.isPending}
                                    onClick={() => {
                                        if (status === "rejected" && !decisionReason.trim()) {
                                            toast.error("Decision reason is required when rejecting a submission");
                                            return;
                                        }
                                        reviewMutation.mutate();
                                    }}
                                >
                                    {reviewMutation.isPending ? (
                                        <>
                                            <div className="spinner-small"></div>
                                            <span>Saving review...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Save Review</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};