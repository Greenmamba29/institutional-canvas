import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shield, Search, FileWarning, Lightbulb, CheckCircle } from 'lucide-react';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { EntityType, RiskLevel, RiskFactor } from '@/services/ai/risk-assessment.service';

export function RiskAnalysis() {
  // The risk engine assesses real supplier entities (suppliers.org_id).
  const entityType: EntityType = 'Supplier';
  const [entityId, setEntityId] = useState('');

  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: assessment, isLoading, refetch } = useRiskAssessment(entityType, entityId);

  // Real selectable entities — suppliers loaded from Supabase.
  const supplierEntities = (suppliers ?? []).map((s) => ({
    id: s.org_id,
    name: s.display_name ?? s.org_id,
  }));

  const getRiskColor = (risk: RiskLevel) => {
    if (risk === 'Critical') return 'text-red-600 bg-red-500/10 border-red-500/20';
    if (risk === 'High') return 'text-orange-600 bg-orange-500/10 border-orange-500/20';
    if (risk === 'Medium') return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
    return 'text-green-600 bg-green-500/10 border-green-500/20';
  };

  const getSeverityColor = (severity: RiskFactor['severity']) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'high') return 'destructive';
    if (severity === 'medium') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Entity Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Analysis Configuration</CardTitle>
          <CardDescription>Select a supplier to assess risks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap items-end">
          <div className="space-y-2 flex-1 min-w-[300px]">
            <label className="text-sm font-medium">Supplier</label>
            <Select value={entityId} onValueChange={setEntityId} disabled={suppliersLoading}>
              <SelectTrigger>
                <SelectValue placeholder={suppliersLoading ? 'Loading suppliers...' : 'Select a supplier...'} />
              </SelectTrigger>
              <SelectContent>
                {supplierEntities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => refetch()}
            disabled={!entityId || isLoading}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Assess Risk
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      ) : assessment ? (
        <div className="space-y-6">
          {/* Risk Score Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                    <Badge className={`text-xl px-4 py-2 ${getRiskColor(assessment.overall_risk)}`}>
                      {assessment.overall_risk}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
                    <div className="text-4xl font-bold">{assessment.risk_score}/100</div>
                  </div>
                </div>
                {assessment.should_flag && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Flagged for Review</span>
                  </div>
                )}
              </div>

              {/* Risk Gauge */}
              <div className="mt-6">
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      assessment.risk_score >= 76
                        ? 'bg-red-500'
                        : assessment.risk_score >= 51
                        ? 'bg-orange-500'
                        : assessment.risk_score >= 26
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${assessment.risk_score}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {(assessment.supplier_risk_factors.length > 0 ||
            assessment.deal_risk_factors.length > 0 ||
            assessment.market_risk_factors.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5" />
                  Risk Factors
                </CardTitle>
                <CardDescription>Identified risks across different categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supplier Risks */}
                {assessment.supplier_risk_factors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Supplier Risks</h4>
                    <div className="space-y-3">
                      {assessment.supplier_risk_factors.map((factor, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">{factor.description}</p>
                            <Badge variant={getSeverityColor(factor.severity)} className="ml-2 capitalize">
                              {factor.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deal Risks */}
                {assessment.deal_risk_factors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Deal Risks</h4>
                    <div className="space-y-3">
                      {assessment.deal_risk_factors.map((factor, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">{factor.description}</p>
                            <Badge variant={getSeverityColor(factor.severity)} className="ml-2 capitalize">
                              {factor.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Risks */}
                {assessment.market_risk_factors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Market Risks</h4>
                    <div className="space-y-3">
                      {assessment.market_risk_factors.map((factor, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">{factor.description}</p>
                            <Badge variant={getSeverityColor(factor.severity)} className="ml-2 capitalize">
                              {factor.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {assessment.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Mitigation Recommendations
                </CardTitle>
                <CardDescription>Actions to reduce identified risks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
                      <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : entityId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No risk assessment available</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Select a supplier above to assess risks</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
