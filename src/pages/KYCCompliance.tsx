import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const TIER_INFO = {
  bronze: {
    label: "Bronze",
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/30",
    description: "Basic identity and company registration documents",
    requirements: ["Government-issued ID", "Company Registration", "Proof of Address"],
  },
  silver: {
    label: "Silver",
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/30",
    description: "Enhanced verification with financial documentation",
    requirements: ["Bronze documents", "Bank Statement (3 months)", "Tax Certificate", "Articles of Incorporation"],
  },
  gold: {
    label: "Gold",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    description: "Full compliance with ESG and product certifications",
    requirements: ["Silver documents", "ESG Certification", "Product Certifications", "Compliance Audit Report"],
  },
};

const STATUS_CONFIG = {
  pending: { label: "Pending Review", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  in_review: { label: "In Review", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  escalated: { label: "Escalated", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10" },
};

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "company_registration", label: "Company Registration" },
  { value: "tax_certificate", label: "Tax Certificate" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "proof_of_address", label: "Proof of Address" },
  { value: "esg_certification", label: "ESG Certification" },
  { value: "product_certification", label: "Product Certification" },
  { value: "articles_of_incorporation", label: "Articles of Incorporation" },
  { value: "other", label: "Other" },
];

export default function KYCCompliance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [docType, setDocType] = useState("");
  const [docName, setDocName] = useState("");
  const [showDocForm, setShowDocForm] = useState(false);

  const { data: kycData, isLoading } = useQuery<KYCStatus>({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kyc_status");
      if (error) throw error;
      return data as unknown as KYCStatus;
    },
  });

  const submitKYC = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("submit_kyc_verification", {
        p_tier: selectedTier,
        p_notes: notes || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "KYC Submitted", description: "Your verification request has been submitted for review." });
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      setNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    },
  });

  const uploadDoc = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("upload_kyc_document", {
        p_kyb_queue_id: kycData?.submission?.id ?? null,
        p_document_type: docType,
        p_file_name: docName,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Document Added", description: "Document record has been added to your submission." });
      queryClient.invalidateQueries({ queryKey: ["kyc-status"] });
      setDocType("");
      setDocName("");
      setShowDocForm(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const submission = kycData?.submission;
  const documents = kycData?.documents ?? [];
  const canSubmit = !submission || submission.status === "rejected";
  const statusCfg = submission ? STATUS_CONFIG[submission.status as keyof typeof STATUS_CONFIG] : null;

  const steps = [
    { label: "Submitted", done: !!submission },
    { label: "In Review", done: submission?.status === "in_review" || submission?.status === "approved" },
    { label: "Decision", done: submission?.status === "approved" || submission?.status === "rejected" },
  ];

  return (
    <>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <PageHeader
          title="KYC / Compliance"
          description="Submit identity verification and compliance documents"
          icon={Shield}
        />

        {/* Status Banner */}
        {submission && statusCfg && (
          <div className={cn("card-premium p-4 flex items-center gap-4", statusCfg.bg)}>
            <statusCfg.icon className={cn("h-5 w-5 shrink-0", statusCfg.color)} />
            <div className="flex-1">
              <p className={cn("font-semibold", statusCfg.color)}>{statusCfg.label}</p>
              <p className="text-sm text-muted-foreground">
                {submission.verification_tier.charAt(0).toUpperCase() + submission.verification_tier.slice(1)} tier verification •{" "}
                Submitted {new Date(submission.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="outline" className={statusCfg.color}>
              {submission.verification_tier.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Rejection Reason */}
        {submission?.status === "rejected" && submission.rejection_reason && (
          <div className="card-premium p-4 border-destructive/30 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-1">Rejection Reason</p>
            <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
          </div>
        )}

        {/* Progress Stepper */}
        {submission && (
          <div className="card-premium p-6">
            <h3 className="font-semibold mb-4">Verification Progress</h3>
            <div className="flex items-center gap-0">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      step.done
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    )}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn("flex-1 h-0.5 mx-2 mb-4", step.done ? "bg-primary" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Form */}
        {canSubmit && (
          <div className="card-premium p-6 space-y-6">
            <h3 className="font-semibold">
              {submission?.status === "rejected" ? "Resubmit Verification" : "Start Verification"}
            </h3>

            {/* Tier Selector */}
            <div className="space-y-3">
              <Label>Select Verification Tier</Label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TIER_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTier(key)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all",
                      selectedTier === key
                        ? `${info.bg} border-current`
                        : "border-border hover:border-border/80 hover:bg-secondary/30"
                    )}
                  >
                    <p className={cn("font-bold text-sm mb-1", selectedTier === key ? info.color : "")}>{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                    {selectedTier === key && (
                      <ul className="mt-2 space-y-0.5">
                        {info.requirements.map((req) => (
                          <li key={req} className="text-xs text-muted-foreground flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kyc-notes">Additional Notes (optional)</Label>
              <Textarea
                id="kyc-notes"
                placeholder="Any additional context for the review team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={() => submitKYC.mutate()}
              disabled={!selectedTier || submitKYC.isPending}
              className="w-full"
            >
              {submitKYC.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        )}

        {/* Documents Section */}
        {submission && (
          <div className="card-premium p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Compliance Documents</h3>
              <Button variant="outline" size="sm" onClick={() => setShowDocForm(!showDocForm)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {showDocForm && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="doc-type">Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger id="doc-type">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="doc-name">Document Name / Reference</Label>
                  <input
                    id="doc-name"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="e.g. passport_john_doe.pdf"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => uploadDoc.mutate()}
                    disabled={!docType || !docName || uploadDoc.isPending}
                  >
                    {uploadDoc.isPending ? "Adding..." : "Add Document"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDocForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const docStatus = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG];
                  return (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {doc.document_type.replace(/_/g, " ")}
                          {doc.expires_at && ` • Expires ${new Date(doc.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      {docStatus && (
                        <Badge variant="outline" className={cn("shrink-0 text-xs", docStatus.color)}>
                          {docStatus.label}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
