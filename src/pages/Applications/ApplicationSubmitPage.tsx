import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Send, Upload, Check, AlertCircle, FileText } from "lucide-react";
import { apiClient } from "@/services/api";
import { uploadFileAsBase64ToMedia } from "@/services/media.service";
import "./ApplicationSubmitPage.css";

type TemplateField = {
    name: string;
    type: "text" | "textarea" | "select" | "checkbox" | "file";
    label: string;
    required: boolean;
    validation?: {
        min_length?: number;
        max_length?: number;
    };
    options?: Array<{ label: string; value: string }>;
};

type Template = {
    id: string;
    code: string;
    name: string;
    description: string;
    is_public: boolean;
    is_active: boolean;
    require_discord_linked: boolean;
    require_samp_linked: boolean;
    fields: TemplateField[];
};

// Página /applications/:code
// - Renderiza os fields do template
// - Se field.type === file -> faz upload base64 para /media/upload/base64 e envia media_id no submit

export const ApplicationSubmitPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState<Record<string, any>>({});
    const [attachments, setAttachments] = useState<Record<string, string[]>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    const { data: templatesData, isLoading } = useQuery({
        queryKey: ["application-templates"],
        queryFn: async () => {
            const res = await apiClient.get("/applications/templates");
            const templates = Array.isArray(res) ? res : res?.templates;
            return (templates || []) as Template[];
        },
    });

    const template = useMemo(() => {
        const list = templatesData || [];
        return list.find((t) => t.code === code) || null;
    }, [templatesData, code]);

    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!template) throw new Error("Template not found");

            // validar required (files são validados em attachments)
            const missing: string[] = [];
            for (const f of template.fields) {
                if (!f.required) continue;
                if (f.type === "file") {
                    if (!attachments[f.name] || attachments[f.name].length === 0) missing.push(f.label);
                } else {
                    const v = data[f.name];
                    const empty = v == null || (typeof v === "string" && v.trim() === "");
                    if (empty) missing.push(f.label);
                }
            }
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(", ")}`);
            }

            return apiClient.post(`/applications/${template.code}/submit`, {
                data,
                attachments,
            });
        },
        onSuccess: (res: any) => {
            toast.success("Application submitted!");
            const submissionId = res?.submission?.id;
            if (submissionId) navigate(`/applications/submissions/${submissionId}`);
            else navigate("/applications/my");
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || err?.message || "Submit failed");
        },
    });

    const onChange = (name: string, value: any) => {
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const onFilePick = async (fieldName: string, file: File | null) => {
        if (!file) return;

        try {
            setUploading((p) => ({ ...p, [fieldName]: true }));
            const mediaId = await uploadFileAsBase64ToMedia(file, "application");
            setAttachments((prev) => ({
                ...prev,
                [fieldName]: [mediaId], // por enquanto 1 arquivo por field
            }));
            toast.success("File uploaded");
        } catch (e: any) {
            toast.error(e?.response?.data?.error || e?.message || "Upload failed");
        } finally {
            setUploading((p) => ({ ...p, [fieldName]: false }));
        }
    };

    if (isLoading) {
        return (
            <div className="submit-page">
                <div className="submit-container">
                    <div className="submit-loading">
                        <div className="spinner"></div>
                        <span>Loading form...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="submit-page">
                <div className="submit-container">
                    <div className="submit-error-card">
                        <AlertCircle size={48} style={{ color: "#ef4444", marginBottom: "1rem" }} />
                        <h2 className="submit-error-title">Form not found</h2>
                        <p className="submit-error-text">
                            The form you're looking for doesn't exist or has been removed.
                        </p>
                        <Link className="btn-primary submit-error-btn" to="/applications">
                            <ArrowLeft size={18} />
                            Back to Forms
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-page">
            <div className="submit-container">
                <div className="submit-header">
                    <div className="submit-title-section">
                        <h1 className="submit-title">{template.name}</h1>
                        <p className="submit-subtitle">{template.description}</p>
                    </div>

                    <div className="submit-actions">
                        <Link className="btn-ghost submit-btn" to="/applications">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">Forms</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                        <Link className="btn-ghost submit-btn" to="/applications/my">
                            <FileText size={18} className="btn-icon" />
                            <span className="btn-text-desktop">My submissions</span>
                            <span className="btn-text-mobile">My Forms</span>
                        </Link>
                    </div>
                </div>

                <div className="submit-card">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitMutation.mutate();
                        }}
                        className="submit-form"
                    >
                        <div className="submit-fields">
                            {template.fields.map((f) => {
                                const value = data[f.name];
                                const min = f.validation?.min_length;
                                const max = f.validation?.max_length;

                                return (
                                    <div key={f.name} className="submit-field-wrapper">
                                        {f.type !== "checkbox" && (
                                            <label className="submit-label">
                                                {f.label}
                                                {f.required && <span className="submit-required">*</span>}
                                            </label>
                                        )}

                                        {f.type === "text" && (
                                            <input
                                                className="input-field submit-input"
                                                value={value || ""}
                                                onChange={(e) => onChange(f.name, e.target.value)}
                                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                                            />
                                        )}

                                        {f.type === "textarea" && (
                                            <textarea
                                                className="input-field submit-textarea"
                                                value={value || ""}
                                                onChange={(e) => onChange(f.name, e.target.value)}
                                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                                            />
                                        )}

                                        {f.type === "select" && (
                                            <select
                                                className="input-field submit-select"
                                                value={value || ""}
                                                onChange={(e) => onChange(f.name, e.target.value)}
                                            >
                                                <option value="">Select an option...</option>
                                                {(f.options || []).map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {f.type === "checkbox" && (
                                            <label className="submit-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    className="submit-checkbox"
                                                    checked={!!value}
                                                    onChange={(e) => onChange(f.name, e.target.checked)}
                                                />
                                                <span className="submit-checkbox-text">{f.label}</span>
                                                {f.required && <span className="submit-required">*</span>}
                                            </label>
                                        )}

                                        {f.type === "file" && (
                                            <div className="submit-file-wrapper">
                                                <div className="submit-file-input-container">
                                                    <input
                                                        className="submit-file-input"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => onFilePick(f.name, e.target.files?.[0] || null)}
                                                        disabled={uploading[f.name]}
                                                    />
                                                    <div className="submit-file-button">
                                                        <Upload size={18} />
                                                        <span>
                                                            {uploading[f.name]
                                                                ? "Uploading..."
                                                                : "Choose file"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="submit-file-status">
                                                    {uploading[f.name] ? (
                                                        <div className="submit-file-uploading">
                                                            <div className="spinner-small"></div>
                                                            <span>Uploading...</span>
                                                        </div>
                                                    ) : attachments[f.name]?.[0] ? (
                                                        <div className="submit-file-success">
                                                            <Check size={16} />
                                                            <span>File uploaded: {attachments[f.name][0]}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="submit-file-empty">
                                                            No file uploaded
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {(min || max) && f.type !== "file" && f.type !== "checkbox" && (
                                            <div className="submit-field-hint">
                                                {min && `Min ${min} characters. `}
                                                {max && `Max ${max} characters.`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="submit-footer">
                            <button
                                className="btn-primary submit-submit-btn"
                                type="submit"
                                disabled={submitMutation.isPending}
                            >
                                {submitMutation.isPending ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Submit Application</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};