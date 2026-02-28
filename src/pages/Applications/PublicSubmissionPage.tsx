import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, FileText, AlertCircle } from "lucide-react";
import { apiClient } from "@/services/api";
import "./PublicSubmissionPage.css";

// Página pública: /applications/public/submissions/:id
// Endpoint: GET /applications/public/submissions/{id}

export const PublicSubmissionPage = () => {
    const { id } = useParams();

    const { data, isLoading } = useQuery({
        queryKey: ["public-submission", id],
        queryFn: async () => apiClient.get(`/applications/public/submissions/${id}`),
        enabled: !!id,
    });

    const submission = data?.submission;
    const template = data?.template;

    return (
        <div className="public-submission-page">
            <div className="public-submission-container">
                <div className="public-submission-header">
                    <div>
                        <h1>{template?.name || "Submission"}</h1>
                        <p>ID: {id}</p>
                    </div>

                    <Link className="btn-ghost" to={template?.code ? `/applications/${template.code}/logs` : "/applications"}>
                        <ArrowLeft size={18} />
                        Back
                    </Link>
                </div>

                <div className="public-submission-card">
                    <div className="public-submission-card-title">
                        <FileText size={18} />
                        Public Submission
                    </div>

                    {isLoading ? (
                        <div className="public-submission-loading">
                            <div className="spinner" />
                            Loading...
                        </div>
                    ) : !submission ? (
                        <div className="public-submission-empty">
                            <AlertCircle size={36} />
                            Not found
                        </div>
                    ) : (
                        <div className="public-submission-body">
                            <div className="public-submission-row">
                                <div className="k">User</div>
                                <div className="v">{submission.user?.username || "Unknown"}</div>
                            </div>
                            <div className="public-submission-row">
                                <div className="k">Status</div>
                                <div className="v">{submission.status}</div>
                            </div>
                            <div className="public-submission-row">
                                <div className="k">Created</div>
                                <div className="v">{submission.created_at || submission.created_ago}</div>
                            </div>

                            <div className="public-submission-divider" />

                            {/* Mostra data (público) */}
                            <pre className="public-submission-json">
{JSON.stringify(submission.data || {}, null, 2)}
              </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};