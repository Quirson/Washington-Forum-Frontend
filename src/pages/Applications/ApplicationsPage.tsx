import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    ChevronRight,
    Shield,
    Users,
    Bug,
    Map,
    DollarSign,
    AlertCircle,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import "./ApplicationsPage.css";

// Página principal /applications (igual a lista de Forms da imagem)
// - Lista templates vindos do backend
// - Mostra "Logs" (se public)
// - Mostra botão "Reviews" (se o user tiver permissão)

type TemplateField = {
    name: string;
    type: "text" | "textarea" | "select" | "checkbox" | "file";
    label: string;
    required: boolean;
    validation?: Record<string, any>;
    options?: Array<{ label: string; value: string }>;
};

type Template = {
    id: string;
    code: string;
    name: string;
    description: string;
    is_public: boolean;
    is_active: boolean;
    min_role_priority: number;
    require_discord_linked: boolean;
    require_samp_linked: boolean;
    fields: TemplateField[];
    urls?: {
        submit?: string;
        public_submissions?: string;
    };
};

const iconFor = (code: string) => {
    const map: Record<string, any> = {
        staff_application: Shield,
        complaint_player: Users,
        complaint_staff: Shield,
        bug_report: Bug,
        mapper_application: Map,
        property_request: DollarSign,
        appeal_ban_samp: AlertCircle,
        appeal_ban_discord: AlertCircle,
        refund_lost_items: DollarSign,
        map_submit: Map,
    };
    return map[code] || FileText;
};

const badgeText = (t: Template) => {
    const tags: string[] = [];
    if (t.is_public) tags.push("PUBLIC");
    else tags.push("PRIVATE");

    if (t.require_discord_linked) tags.push("Discord");
    if (t.require_samp_linked) tags.push("SA-MP");

    return tags.join(" • ");
};

export const ApplicationsPage = () => {
    const { user } = useAuthStore();


    const canSeeReviews = (user?.role_priority || 0) >= 700; // ajusta se quiser
    const { data, isLoading } = useQuery({
        queryKey: ["application-templates"],
        queryFn: async () => {
            const res = await apiClient.get("/applications/templates");
            // suporta {templates:[...]} OU array direto
            const templates = Array.isArray(res) ? res : res?.templates;
            return (templates || []) as Template[];
        },
    });
    const { data: pendingData } = useQuery({
        queryKey: ["reviews-pending-count"],
        queryFn: async () => apiClient.get("/applications/reviews/pending?page=1&limit=1"),
        enabled: canSeeReviews,
        refetchInterval: 15000, // 15s (ou 30s)
    });

    const pendingCount = pendingData?.pagination?.total ?? 0;

    const templates = useMemo(() => (data || []).filter((t) => t.is_active), [data]);

    // ⚙️ regras simples para mostrar botão Reviews
    // - backend já controla /reviews/pending e /review; mas aqui é só UI


    return (
        <div className="applications-page">
            <div className="applications-container">
                <div className="applications-header">
                    <div className="applications-title-section">
                        <h1 className="applications-title">Forms</h1>
                        <p className="applications-subtitle">
                            Choose the form you want to submit.
                        </p>
                    </div>

                    <div className="applications-actions">
                        <Link className="btn-ghost applications-btn" to="/applications/my">
                            <span className="btn-text-desktop">My submissions</span>
                            <span className="btn-text-mobile">My Forms</span>
                        </Link>
                        {canSeeReviews && (
                            <Link className="btn-primary applications-btn" to="/applications/reviews">
                                Reviews
                                {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="applications-card">
                    <div className="applications-card-header">
                        Forms
                    </div>

                    {isLoading ? (
                        <div className="applications-loading">
                            <div className="spinner"></div>
                            <span>Loading forms...</span>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="applications-empty">
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                            <p>No forms available at the moment.</p>
                        </div>
                    ) : (
                        <div className="applications-list">
                            {templates.map((t) => {
                                const Icon = iconFor(t.code);
                                return (
                                    <div key={t.id} className="application-item">
                                        <div className="application-content">
                                            <div className="application-icon">
                                                <Icon size={20} />
                                            </div>

                                            <div className="application-info">
                                                <h3 className="application-name">{t.name}</h3>
                                                <p className="application-description">
                                                    {t.description}
                                                </p>
                                                <div className="application-badges">
                                                    {badgeText(t)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="application-buttons">
                                            {t.is_public && (
                                                <Link
                                                    className="btn-ghost application-btn-secondary"
                                                    to={`/applications/${t.code}/logs`}
                                                >
                                                    Logs
                                                </Link>
                                            )}

                                            <Link
                                                className="btn-primary application-btn-primary"
                                                to={`/applications/${t.code}`}
                                            >
                                                <span className="application-btn-content">
                                                    <span className="btn-text-desktop">Create</span>
                                                    <span className="btn-text-mobile">+</span>
                                                    <ChevronRight size={18} className="btn-chevron" />
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};