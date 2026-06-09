import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Search, Star, MapPin, Package, TrendingUp, Phone, FileText } from 'lucide-react';
import { useSupplierMatcher } from '@/hooks/useSupplierMatcher';
import { useRFQs } from '@/hooks/useRFQs';
import type { SupplierMatch } from '@/services/ai/supplier-matcher.service';

export function SupplierMatcher() {
  const [selectedRfqId, setSelectedRfqId] = useState<string>('');

  const { data: matches, isLoading, refetch } = useSupplierMatcher(selectedRfqId);

  // Real RFQs from Supabase (id + title) for the selector.
  const { data: rfqs, isLoading: rfqsLoading } = useRFQs();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getActionVariant = (action: SupplierMatch['recommended_action']) => {
    if (action === 'Request Quote') return 'default';
    if (action === 'Schedule Call') return 'secondary';
    return 'outline';
  };

  const getRadarData = (match: SupplierMatch) => [
    { category: 'Product', score: match.product_match_score, fullMark: 40 },
    { category: 'Capacity', score: match.capacity_match_score, fullMark: 20 },
    { category: 'Geographic', score: match.geographic_score, fullMark: 15 },
    { category: 'Performance', score: match.performance_score, fullMark: 15 },
    { category: 'Price', score: match.price_score, fullMark: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* RFQ Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supplier Matching Configuration</CardTitle>
          <CardDescription>Select an RFQ to find matching suppliers</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap items-end">
          <div className="space-y-2 flex-1 min-w-[300px]">
            <label className="text-sm font-medium">Request for Quote (RFQ)</label>
            <Select value={selectedRfqId} onValueChange={setSelectedRfqId} disabled={rfqsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={rfqsLoading ? 'Loading RFQs...' : 'Select an RFQ...'} />
              </SelectTrigger>
              <SelectContent>
                {(rfqs ?? []).map((rfq) => (
                  <SelectItem key={rfq.id} value={rfq.id}>
                    {rfq.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => refetch()}
            disabled={!selectedRfqId || isLoading}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Find Matches
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Matching Suppliers Found</p>
                  <p className="text-3xl font-bold">{matches.length}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Top Match Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(matches[0]?.total_score || 0)}`}>
                    {matches[0]?.total_score || 0}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Recommended Actions</p>
                  <p className="text-lg font-semibold">
                    {matches.filter(m => m.recommended_action === 'Request Quote').length} to quote
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Results */}
          {matches.map((match) => (
            <Card key={match.supplier_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-muted-foreground">#{match.ranking}</div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {match.supplier_name}
                        {match.avg_rating > 0 && (
                          <span className="flex items-center gap-1 text-sm font-normal text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            {match.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.distance_km.toLocaleString()}km away
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {match.past_deals_count} deals
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`text-lg ${getScoreColor(match.total_score)}`}>
                    {match.total_score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scores */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Score Breakdown</h4>
                    {[
                      { label: 'Product Match', score: match.product_match_score, max: 40 },
                      { label: 'Capacity Match', score: match.capacity_match_score, max: 20 },
                      { label: 'Geographic', score: match.geographic_score, max: 15 },
                      { label: 'Performance', score: match.performance_score, max: 15 },
                      { label: 'Price', score: match.price_score, max: 10 },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-mono font-semibold">
                            {item.score}/{item.max}
                          </span>
                        </div>
                        <Progress value={(item.score / item.max) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>

                  {/* Radar Chart */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Match Profile</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={getRadarData(match)}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Why This Supplier Matches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {match.reasoning.slice(0, 6).map((reason, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant={getActionVariant(match.recommended_action)} className="gap-2">
                    <FileText className="h-4 w-4" />
                    {match.recommended_action}
                  </Button>
                  {match.total_score >= 60 && (
                    <Button variant="outline" className="gap-2">
                      <Phone className="h-4 w-4" />
                      Schedule Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedRfqId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No matching suppliers found for this RFQ</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Select an RFQ above to find matching suppliers</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
