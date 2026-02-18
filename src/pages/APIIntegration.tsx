import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Webhook,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
}

const AVAILABLE_SCOPES = [
  { value: "read:rfqs", label: "Read RFQs", description: "Access request for quote data" },
  { value: "read:auctions", label: "Read Auctions", description: "Access live auction data" },
  { value: "write:bids", label: "Write Bids", description: "Submit bids programmatically" },
  { value: "read:marketplace", label: "Read Marketplace", description: "Access supplier directory" },
  { value: "read:prices", label: "Read Prices", description: "Access live price data" },
  { value: "webhook", label: "Webhooks", description: "Receive webhook events" },
];

export default function APIIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rawKeyOpen, setRawKeyOpen] = useState(false);
  const [rawKey, setRawKey] = useState("");
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:rfqs", "read:marketplace"]);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiKey[];
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_api_key", {
        p_name: keyName,
        p_scopes: selectedScopes,
      });
      if (error) throw error;
      return data as { raw_key: string; prefix: string; name: string };
    },
    onSuccess: (data) => {
      setRawKey(data.raw_key);
      setCreateOpen(false);
      setRawKeyOpen(true);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setKeyName("");
      setSelectedScopes(["read:rfqs", "read:marketplace"]);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create key", description: err.message, variant: "destructive" });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase.rpc("revoke_api_key", { p_key_id: keyId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Key Revoked", description: "The API key has been permanently revoked." });
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to revoke", description: err.message, variant: "destructive" });
    },
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyRawKey = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeKeys = apiKeys.filter((k) => !k.revoked_at);
  const revokedKeys = apiKeys.filter((k) => k.revoked_at);

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <PageHeader
          title="API Integration"
          description="Manage API keys and webhook configuration for external systems"
          icon={Key}
        />

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {activeKeys.length} active {activeKeys.length === 1 ? "key" : "keys"}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Active Keys */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" />
            Active Keys
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-secondary/50 rounded animate-pulse" />)}
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-10">
              <Key className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">No active API keys</p>
              <p className="text-xs text-muted-foreground mt-1">Create a key to integrate external systems</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map((key) => (
                <div key={key.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/20 border border-border/50">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{key.name}</span>
                      <Badge variant="outline" className="text-green-500 text-[10px]">Active</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground font-mono">{key.key_prefix}</code>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-[10px]">{scope}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {format(new Date(key.created_at), "MMM d, yyyy")}
                      {key.last_used_at && ` • Last used ${format(new Date(key.last_used_at), "MMM d, yyyy")}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => revokeKey.mutate(key.id)}
                    disabled={revokeKey.isPending}
                    aria-label={`Revoke ${key.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook Info */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook Integration
          </h3>
          <p className="text-sm text-muted-foreground">
            LithiumBuy can push real-time events to your systems via webhooks. Configure your endpoint
            to receive notifications for bids, deals, auction updates, and order status changes.
          </p>
          <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-2">
            <p className="text-xs font-mono text-muted-foreground">POST https://api.lithiumbuy.com/webhooks</p>
            <p className="text-xs text-muted-foreground">
              Include your API key in the <code className="text-primary">Authorization: Bearer lb_live_...</code> header.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 flex items-start gap-3">
            <Code2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Webhook documentation</p>
              <p className="text-xs text-muted-foreground">
                Full webhook event documentation and payload schemas will be available in the developer portal.
                Contact support to enable webhook delivery for your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Revoked Keys */}
        {revokedKeys.length > 0 && (
          <div className="card-premium p-6 space-y-3">
            <h3 className="font-semibold text-muted-foreground text-sm">Revoked Keys</h3>
            {revokedKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-4 p-3 rounded-lg opacity-50">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground line-through">{key.name}</span>
                  <code className="block text-xs text-muted-foreground font-mono">{key.key_prefix}</code>
                </div>
                <Badge variant="outline" className="text-muted-foreground text-[10px]">Revoked</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Create Key Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                The raw key will be shown once. Store it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <input
                  id="key-name"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Production ERP Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions (Scopes)</Label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.value} className="flex items-start gap-3 p-2 rounded hover:bg-secondary/30">
                      <Checkbox
                        id={scope.value}
                        checked={selectedScopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      <label htmlFor={scope.value} className="flex-1 cursor-pointer">
                        <span className="text-sm font-medium">{scope.label}</span>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createKey.mutate()}
                disabled={!keyName || selectedScopes.length === 0 || createKey.isPending}
              >
                {createKey.isPending ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Raw Key Dialog */}
        <Dialog open={rawKeyOpen} onOpenChange={setRawKeyOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                API Key Created
              </DialogTitle>
              <DialogDescription>
                Copy this key now. It will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border font-mono text-sm break-all">
                <span className="flex-1 text-xs">{rawKey}</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This key grants API access to your organization. Keep it secret and never commit it to source control.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={copyRawKey} className="w-full">
                {copied ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy API Key</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}
