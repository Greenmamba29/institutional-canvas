import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface KYCStatus {
  submission: {
    id: string;
    verification_tier: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
    notes: string | null;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    status: string;
    created_at: string;
    expires_at: string | null;
    rejection_reason: string | null;
  }>;
}

const TIER_COLORS = {
  bronze: { label: "Bronze", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", stars: 1 },
  silver: { label: "Silver", color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30", stars: 2 },
  gold: { label: "Gold", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30", stars: 3 },
};

const DOC_STATUS_COLORS = {
  uploaded: "text-muted-foreground",
  under_review: "text-blue-500",
  accepted: "text-green-500",
  rejected: "text-destructive",
};

export default function CompanyVerification() {
  const navigate = useNavigate();

  const { data: kycData, isLoading } = useQuery<KYCStatus>({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kyc_status");
      if (error) throw error;
      return data as unknown as KYCStatus;
    },
  });

  const submission = kycData?.submission;
  const documents = kycData?.documents ?? [];
  const tier = submission ? TIER_COLORS[submission.verification_tier as keyof typeof TIER_COLORS] : null;

  const docAccepted = (type: string) =>
    documents.some((d) => d.document_type === type && d.status === "accepted");

  const REQUIRED_DOC_TYPES = [
    { type: "passport", label: "Passport / National ID" },
    { type: "company_registration", label: "Company Registration" },
    { type: "proof_of_address", label: "Proof of Address" },
    { type: "tax_certificate", label: "Tax Certificate" },
    { type: "bank_statement", label: "Bank Statement" },
  ];

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-4 animate-pulse max-w-3xl">
          <div className="h-8 bg-secondary rounded w-64" />
          <div className="h-32 bg-secondary rounded" />
          <div className="h-48 bg-secondary rounded" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <PageHeader
          title="Company Verification"
          description="Business verification status and credentials"
          icon={Building2}
        />

        {/* Not started */}
        {!submission && (
          <div className="card-premium p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Start Your Verification</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Complete business verification to build trust with marketplace partners and unlock
                additional platform features.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-left">
              {Object.entries(TIER_COLORS).map(([key, info]) => (
                <div key={key} className={cn("p-3 rounded-lg border", info.bg)}>
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: info.stars }).map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3 fill-current", info.color)} />
                    ))}
                  </div>
                  <p className={cn("font-semibold text-sm", info.color)}>{info.label}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/settings/kyc")}>
              <Shield className="h-4 w-4 mr-2" />
              Start Verification
            </Button>
          </div>
        )}

        {/* Approved */}
        {submission?.status === "approved" && tier && (
          <div className={cn("card-premium p-6 border-2", tier.bg)}>
            <div className="flex items-center gap-4">
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", tier.bg)}>
                <CheckCircle2 className={cn("h-7 w-7", tier.color)} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Verification Status</p>
                <p className={cn("text-2xl font-bold", tier.color)}>{tier.label} Verified</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Approved {submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString() : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: tier.stars }).map((_, i) => (
                  <Star key={i} className={cn("h-5 w-5 fill-current", tier.color)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending / In Review */}
        {submission && (submission.status === "pending" || submission.status === "in_review") && (
          <div className="card-premium p-6 bg-yellow-500/5 border-yellow-500/20">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500 shrink-0" />
              <div>
                <p className="font-semibold">
                  {submission.status === "pending" ? "Awaiting Review" : "Under Review"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your {submission.verification_tier} tier application was submitted on{" "}
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected */}
        {submission?.status === "rejected" && (
          <div className="card-premium p-6 bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-4 mb-3">
              <XCircle className="h-8 w-8 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-destructive">Verification Rejected</p>
                <p className="text-sm text-muted-foreground">
                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {submission.rejection_reason && (
              <div className="p-3 rounded-lg bg-background/50 text-sm text-muted-foreground mb-3">
                <strong>Reason:</strong> {submission.rejection_reason}
              </div>
            )}
            <Button variant="outline" onClick={() => navigate("/settings/kyc")}>
              Resubmit Verification
            </Button>
          </div>
        )}

        {/* Escalated */}
        {submission?.status === "escalated" && (
          <div className="card-premium p-6 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-orange-500 shrink-0" />
              <div>
                <p className="font-semibold text-orange-500">Under Escalated Review</p>
                <p className="text-sm text-muted-foreground">
                  Your submission requires additional review. Our team will contact you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Document Checklist */}
        {submission && (
          <div className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Document Checklist</h3>
              <Button variant="outline" size="sm" onClick={() => navigate("/settings/kyc")}>
                <FileText className="h-4 w-4 mr-2" />
                Manage Documents
              </Button>
            </div>
            <div className="space-y-2">
              {REQUIRED_DOC_TYPES.map((req) => {
                const matching = documents.filter((d) => d.document_type === req.type);
                const accepted = matching.some((d) => d.status === "accepted");
                const uploaded = matching.length > 0;
                return (
                  <div key={req.type} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                    {accepted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : uploaded ? (
                      <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    )}
                    <span className={cn("text-sm flex-1", accepted ? "text-foreground" : "text-muted-foreground")}>
                      {req.label}
                    </span>
                    <Badge variant="outline" className={cn("text-xs", accepted ? "text-green-500" : uploaded ? "text-yellow-500" : "text-muted-foreground")}>
                      {accepted ? "Accepted" : uploaded ? "Uploaded" : "Missing"}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* All uploaded documents */}
            {documents.length > 0 && (
              <>
                <hr className="border-border/50" />
                <h4 className="text-sm font-medium text-muted-foreground">All Uploaded Documents</h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{doc.file_name}</span>
                      <span className={cn("text-xs capitalize", DOC_STATUS_COLORS[doc.status as keyof typeof DOC_STATUS_COLORS])}>
                        {doc.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
