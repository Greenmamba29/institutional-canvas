import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Lightbulb } from 'lucide-react';
import { usePriceForecast, usePriceHistory } from '@/hooks/usePriceForecast';

export function PriceForecast() {
  const [commodity, setCommodity] = useState<'lithium_carbonate' | 'lithium_hydroxide'>('lithium_carbonate');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);

  const { data: forecast, isLoading, refetch } = usePriceForecast(commodity, horizon);
  const { data: chartData } = usePriceHistory(commodity, horizon);

  const getTrendIcon = (trend: string) => {
    if (trend === 'bullish') return <TrendingUp className="h-4 w-4" />;
    if (trend === 'bearish') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'bullish') return 'text-green-600 bg-green-500/10 border-green-500/20';
    if (trend === 'bearish') return 'text-red-600 bg-red-500/10 border-red-500/20';
    return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Price Forecast Configuration</CardTitle>
          <CardDescription>Select commodity and forecast horizon</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Commodity</label>
            <Select value={commodity} onValueChange={(v) => setCommodity(v as typeof commodity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lithium_carbonate">Lithium Carbonate</SelectItem>
                <SelectItem value="lithium_hydroxide">Lithium Hydroxide</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 min-w-[150px]">
            <label className="text-sm font-medium">Forecast Horizon</label>
            <Select value={horizon.toString()} onValueChange={(v) => setHorizon(Number(v) as typeof horizon)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
        </CardContent>
      </Card>

      {/* Trend Summary */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : forecast ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Market Trend</p>
                <Badge className={`gap-2 ${getTrendColor(forecast.trend)}`}>
                  {getTrendIcon(forecast.trend)}
                  <span className="capitalize font-semibold">{forecast.trend}</span>
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-2">Forecast Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${forecast.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold">{forecast.confidence}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price Forecast Chart</CardTitle>
          <CardDescription>Historical prices + {horizon}-day prediction with confidence bands</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-semibold mb-1">{new Date(data.date).toLocaleDateString()}</p>
                          <p className="text-sm text-primary">
                            Price: <span className="font-mono">${data.predicted_price.toLocaleString()}</span>
                          </p>
                          {!data.is_historical && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Range: ${data.confidence_lower.toLocaleString()} - ${data.confidence_upper.toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="none"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="none"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  name="Lower Bound"
                />
                <Line
                  type="monotone"
                  dataKey="predicted_price"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return payload.is_historical ? null : (
                      <circle cx={cx} cy={cy} r={3} fill="#8884d8" />
                    );
                  }}
                  name="Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {forecast && forecast.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {forecast.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm">{insight}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
