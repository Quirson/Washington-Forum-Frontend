import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    FileText,
    AlertCircle,
    Shield,
    Map,
    Bug,
    Eye,
    Filter
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import "./ReviewsPage.css";

// Página /applications/reviews
// - Divide em Tabs por "categoria" (aqui vamos por grupos fixos por code)
// - Lista pendentes usando /applications/reviews/pending

const GROUPS: Array<{ key: string; title: string; codes: string[]; icon: any }> = [
    {
        key: "complaints",
        title: "Complaints",
        codes: ["complaint_player", "complaint_staff"],
        icon: AlertCircle,
    },
    {
        key: "appeals",
        title: "Ban Appeals",
        codes: ["appeal_ban_samp", "appeal_ban_discord"],
        icon: Shield,
    },
    {
        key: "maps",
        title: "Maps",
        codes: ["mapper_application", "map_submit"],
        icon: Map,
    },
    {
        key: "other",
        title: "Other",
        codes: ["bug_report", "refund_lost_items", "property_request", "staff_application"],
        icon: Bug,
    },
];

export const ReviewsPage = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState(GROUPS[0].key);

    const { data: pendingData, isLoading } = useQuery({
        queryKey: ["reviews-pending"],
        queryFn: async () => apiClient.get("/applications/reviews/pending?page=1&limit=50"),
    });

    const submissions = pendingData?.submissions || [];

    // UI rules de acesso (ajusta como quiser)
    const rolePriority = user?.role_priority || 700;

    // Exemplo simples: esconder tab complaints_staff para quem não é pelo menos 300
    const visibleGroups = useMemo(() => {
        return GROUPS.filter((g) => {
            if (g.key === "complaints" && rolePriority < 700) return false;
            return true;
        });
    }, [rolePriority]);

    const activeGroup = visibleGroups.find((g) => g.key === activeTab) || visibleGroups[0];
    const ActiveIcon = activeGroup.icon;

    const filtered = useMemo(() => {
        const codes = new Set(activeGroup.codes);
        return submissions.filter((s: any) =>
            codes.has(s.template_code || s.template?.code || s.template_id || s.template_name || s.template_code)
        );
    }, [submissions, activeGroup]);

    const displaySubmissions = filtered.length ? filtered : submissions;

    return (
        <div className="reviews-page">
            <div className="reviews-container">
                <div className="reviews-header">
                    <div className="reviews-title-section">
                        <h1 className="reviews-title">Reviews</h1>
                        <p className="reviews-subtitle">
                            Pending submissions to review ({submissions.length})
                        </p>
                    </div>

                    <div className="reviews-actions">
                        <Link className="btn-ghost reviews-btn" to="/applications">
                            <ArrowLeft size={18} className="btn-icon" />
                            <span className="btn-text-desktop">Forms</span>
                            <span className="btn-text-mobile">Back</span>
                        </Link>
                    </div>
                </div>

                {/* Tabs Card */}
                <div className="reviews-tabs-card">
                    <div className="reviews-tabs-header">
                        <Filter size={18} />
                        <span>Filter by Category</span>
                    </div>
                    <div className="reviews-tabs">
                        {visibleGroups.map((g) => {
                            const Icon = g.icon;
                            const isActive = activeTab === g.key;
                            return (
                                <button
                                    key={g.key}
                                    className={`reviews-tab ${isActive ? "reviews-tab-active" : ""}`}
                                    onClick={() => setActiveTab(g.key)}
                                    type="button"
                                >
                                    <Icon size={18} className="reviews-tab-icon" />
                                    <span className="reviews-tab-text">{g.title}</span>
                                    {isActive && (
                                        <span className="reviews-tab-count">
                                            {filtered.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Card */}
                <div className="reviews-card">
                    <div className="reviews-card-header">
                        <div className="reviews-card-header-content">
                            <ActiveIcon size={20} className="reviews-header-icon" />
                            <span>{activeGroup.title}</span>
                        </div>
                        <div className="reviews-card-header-badge">
                            {displaySubmissions.length} pending
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="reviews-loading">
                            <div className="spinner"></div>
                            <span>Loading submissions...</span>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="reviews-empty">
                            <FileText size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                            <p className="reviews-empty-title">No pending submissions</p>
                            <p className="reviews-empty-text">
                                All caught up! There are no submissions waiting for review.
                            </p>
                        </div>
                    ) : displaySubmissions.length === 0 ? (
                        <div className="reviews-empty">
                            <ActiveIcon size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                            <p className="reviews-empty-title">No {activeGroup.title.toLowerCase()}</p>
                            <p className="reviews-empty-text">
                                No pending submissions in this category.
                            </p>
                        </div>
                    ) : (
                        <div className="reviews-list">
                            {displaySubmissions.map((s: any) => (
                                <Link
                                    key={s.id}
                                    to={`/applications/reviews/submissions/${s.id}`}
                                    className="review-item"
                                >
                                    <div className="review-content">
                                        <div className="review-icon-wrapper">
                                            <div className="review-icon">
                                                <FileText size={20} />
                                            </div>
                                        </div>

                                        <div className="review-info">
                                            <h3 className="review-name">
                                                {s.template_name || s.template?.name || "Submission"}
                                            </h3>
                                            <p className="review-meta">
                                                by <span className="review-author">{s.user?.username || "User"}</span>
                                                {" • "}
                                                <span className="review-date">{s.created_ago || s.created_at}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="review-status-wrapper">
                                        <div className="review-status">
                                            {s.status}
                                        </div>
                                        <Eye size={18} className="review-view-icon" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};