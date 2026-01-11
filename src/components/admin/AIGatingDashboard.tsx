import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Activity, AlertTriangle, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAIFeatureFlags,
  updateAIFeatureFlag,
  getReleaseGates,
  updateReleaseGate,
  getAIRunHistory,
  getRiskFlags,
  getAIGatingStats,
  type AIFeatureFlag,
  type ReleaseGate,
  type AIRunLedger,
  type RiskFlag,
} from '@/services/ai-gating.service';

export function AIGatingDashboard() {
  const [features, setFeatures] = useState<AIFeatureFlag[]>([]);
  const [gates, setGates] = useState<ReleaseGate[]>([]);
  const [runs, setRuns] = useState<AIRunLedger[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [stats, setStats] = useState({
    totalFeatures: 0,
    enabledFeatures: 0,
    shadowFeatures: 0,
    totalRuns: 0,
    failedRuns: 0,
    openRiskFlags: 0,
    pendingKYB: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [featuresData, gatesData, runsData, riskData, statsData] = await Promise.all([
        getAIFeatureFlags(),
        getReleaseGates(),
        getAIRunHistory(50),
        getRiskFlags(20),
        getAIGatingStats(),
      ]);
      setFeatures(featuresData);
      setGates(gatesData);
      setRuns(runsData);
      setRiskFlags(riskData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading gating data:', error);
      toast.error('Failed to load AI gating data');
    }
    setLoading(false);
  }

  async function handleFeatureToggle(featureKey: string, newStatus: 'on' | 'off' | 'shadow') {
    const success = await updateAIFeatureFlag(featureKey, newStatus);
    if (success) {
      toast.success(`Feature ${featureKey} set to ${newStatus}`);
      loadData();
    } else {
      toast.error('Failed to update feature flag');
    }
  }

  async function handleGateUpdate(gateId: string, newStatus: 'open' | 'closed' | 'review_required') {
    const success = await updateReleaseGate(gateId, newStatus);
    if (success) {
      toast.success(`Gate ${gateId} set to ${newStatus}`);
      loadData();
    } else {
      toast.error('Failed to update release gate');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'on':
      case 'open':
      case 'completed':
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="w-3 h-3 mr-1" />{status}
        </Badge>;
      case 'off':
      case 'closed':
      case 'failed':
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
          <XCircle className="w-3 h-3 mr-1" />{status}
        </Badge>;
      case 'shadow':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
          <Eye className="w-3 h-3 mr-1" />{status}
        </Badge>;
      case 'started':
      case 'pending':
      case 'in_review':
      case 'review_required':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="w-3 h-3 mr-1" />{status}
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">CRITICAL</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-black">MEDIUM</Badge>;
      case 'low':
        return <Badge variant="outline">LOW</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Features</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {stats.enabledFeatures}/{stats.totalFeatures}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.shadowFeatures} in shadow mode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI Runs (24h)</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              {stats.totalRuns}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.failedRuns} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Risk Flags</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {stats.openRiskFlags}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending KYB</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {stats.pendingKYB}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">AI Features</TabsTrigger>
          <TabsTrigger value="gates">Release Gates</TabsTrigger>
          <TabsTrigger value="runs">Run History</TabsTrigger>
          <TabsTrigger value="risks">Risk Flags</TabsTrigger>
        </TabsList>

        {/* AI Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>AI Feature Flags</CardTitle>
              <CardDescription>
                Control which AI features are enabled. Shadow mode runs AI but doesn't apply results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell className="font-mono text-sm">
                        {feature.feature_key}
                      </TableCell>
                      <TableCell>{feature.description || feature.name}</TableCell>
                      <TableCell>{getStatusBadge(feature.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={feature.status}
                          onValueChange={(value) =>
                            handleFeatureToggle(feature.feature_key, value as 'on' | 'off' | 'shadow')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on">Enabled</SelectItem>
                            <SelectItem value="shadow">Shadow</SelectItem>
                            <SelectItem value="off">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Release Gates Tab */}
        <TabsContent value="gates">
          <Card>
            <CardHeader>
              <CardTitle>Release Gates</CardTitle>
              <CardDescription>
                Control deployment and feature release approvals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gate ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gates.map((gate) => (
                    <TableRow key={gate.id}>
                      <TableCell className="font-mono text-sm">{gate.gate_id}</TableCell>
                      <TableCell>{gate.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{gate.gate_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(gate.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={gate.status}
                          onValueChange={(value) =>
                            handleGateUpdate(gate.gate_id, value as 'open' | 'closed' | 'review_required')
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="review_required">Review Required</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Run History Tab */}
        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>AI Run History</CardTitle>
              <CardDescription>
                Audit log of all AI executions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run ID</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs">{run.run_id.slice(0, 16)}...</TableCell>
                      <TableCell>{run.feature_key}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{run.trigger_source}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.completed_at
                          ? `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Flags Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
              <CardDescription>
                Security and compliance alerts requiring attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Flagged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskFlags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No risk flags found
                      </TableCell>
                    </TableRow>
                  ) : (
                    riskFlags.map((flag) => (
                      <TableRow key={flag.id}>
                        <TableCell>
                          <Badge variant="outline">{flag.flag_type}</Badge>
                        </TableCell>
                        <TableCell>{getSeverityBadge(flag.severity)}</TableCell>
                        <TableCell className="max-w-md truncate">{flag.description}</TableCell>
                        <TableCell>{getStatusBadge(flag.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(flag.flagged_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIGatingDashboard;
