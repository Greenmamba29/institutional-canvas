import { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getEnvStatus, validateEnv } from '@/config/env';
import { useAuth } from '@/context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  User,
  Shield,
  Loader2,
  Server,
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'loading' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function Health() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const results: HealthCheck[] = [];

    // 1. Environment Variables Check
    const envStatus = getEnvStatus();
    results.push({
      name: 'Environment Variables',
      status: envStatus.status === 'ok' ? 'success' : envStatus.status === 'error' ? 'error' : 'warning',
      message: envStatus.status === 'ok' 
        ? 'All required variables configured' 
        : `${envStatus.details.errors.length} errors, ${envStatus.details.warnings.length} warnings`,
      details: [...envStatus.details.errors, ...envStatus.details.warnings].join('; '),
    });
    setChecks([...results]);

    // 2. Supabase Connection Check
    try {
      const start = Date.now();
      const { error } = await supabase.from('organizations').select('id').limit(1);
      const duration = Date.now() - start;
      
      if (error) {
        results.push({
          name: 'Supabase Connection',
          status: 'error',
          message: 'Database query failed',
          details: error.message,
        });
      } else {
        results.push({
          name: 'Supabase Connection',
          status: 'success',
          message: `Connected (${duration}ms)`,
        });
      }
    } catch (err) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }
    setChecks([...results]);

    // 3. Authentication Check
    results.push({
      name: 'Authentication',
      status: user ? 'success' : 'warning',
      message: user ? `Logged in as ${user.email}` : 'Not authenticated',
      details: user ? `User ID: ${user.id}` : 'Login to test authenticated endpoints',
    });
    setChecks([...results]);

    // 4. RPC Functions Check (public - suppliers_public view)
    try {
      const { data, error } = await supabase
        .from('suppliers_public')
        .select('org_id')
        .limit(1);

      if (error) {
        results.push({
          name: 'Database Views',
          status: error.message.includes('does not exist') ? 'warning' : 'error',
          message: 'suppliers_public view check failed',
          details: error.message,
        });
      } else {
        results.push({
          name: 'Database Views',
          status: 'success',
          message: `suppliers_public accessible (${data?.length ?? 0} sample rows)`,
        });
      }
    } catch (err) {
      results.push({
        name: 'Database Views',
        status: 'error',
        message: 'View query failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }
    setChecks([...results]);

    // 5. Auth-required check (org_members)
    if (user) {
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .limit(5);

        if (error) {
          results.push({
            name: 'User Organizations',
            status: 'error',
            message: 'Failed to fetch user organizations',
            details: error.message,
          });
        } else {
          results.push({
            name: 'User Organizations',
            status: data && data.length > 0 ? 'success' : 'warning',
            message: data && data.length > 0 
              ? `Found ${data.length} organization(s)` 
              : 'No organizations found',
            details: data && data.length > 0 
              ? `Roles: ${data.map(d => d.role).join(', ')}` 
              : 'User should complete onboarding',
          });
        }
      } catch (err) {
        results.push({
          name: 'User Organizations',
          status: 'error',
          message: 'Query failed',
          details: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    } else {
      results.push({
        name: 'User Organizations',
        status: 'warning',
        message: 'Skipped (requires authentication)',
      });
    }
    setChecks([...results]);

    // 6. RFQs Table Check
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('id')
        .limit(1);

      if (error) {
        results.push({
          name: 'RFQs Table',
          status: error.code === 'PGRST116' ? 'warning' : 'error',
          message: error.code === 'PGRST116' ? 'No RFQs visible (RLS)' : 'Query failed',
          details: error.message,
        });
      } else {
        results.push({
          name: 'RFQs Table',
          status: 'success',
          message: 'RFQs table accessible',
          details: `Sample: ${data?.length ?? 0} rows`,
        });
      }
    } catch (err) {
      results.push({
        name: 'RFQs Table',
        status: 'error',
        message: 'Query failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      });
    }
    setChecks([...results]);

    setIsRunning(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, [user]);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'success':
        return <Badge className="bg-success/10 text-success border-success/20">Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Warning</Badge>;
    }
  };

  const overallStatus = checks.some(c => c.status === 'error') 
    ? 'error' 
    : checks.some(c => c.status === 'warning') 
      ? 'warning' 
      : checks.length > 0 
        ? 'success' 
        : 'loading';

  return (
    <LayoutShell>
      <PageHeader
        title="System Health"
        description="Check connectivity, configuration, and database status"
      />

      {/* Overall Status */}
      <Card className="mt-6 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${
              overallStatus === 'success' ? 'bg-success/10' :
              overallStatus === 'error' ? 'bg-destructive/10' :
              overallStatus === 'warning' ? 'bg-warning/10' :
              'bg-muted'
            }`}>
              <Server className={`h-6 w-6 ${
                overallStatus === 'success' ? 'text-success' :
                overallStatus === 'error' ? 'text-destructive' :
                overallStatus === 'warning' ? 'text-warning' :
                'text-muted-foreground'
              }`} />
            </div>
            <div>
              <CardTitle>Overall Status</CardTitle>
              <CardDescription>
                {checks.length} checks completed
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={runHealthChecks}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* Individual Checks */}
      <div className="space-y-4">
        {checks.map((check, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h3 className="font-medium">{check.name}</h3>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted px-2 py-1 rounded">
                        {check.details}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(check.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environment Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Environment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Supabase URL</p>
              <p className="font-mono text-xs truncate">
                {import.meta.env.VITE_SUPABASE_URL?.replace(/https:\/\//, '').slice(0, 20)}...
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Mode</p>
              <p className="font-mono text-xs">{import.meta.env.MODE}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ElevenLabs</p>
              <p className="font-mono text-xs">
                {import.meta.env.VITE_ELEVENLABS_AGENT_ID ? 'Configured' : 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Build</p>
              <p className="font-mono text-xs">{import.meta.env.PROD ? 'Production' : 'Development'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </LayoutShell>
  );
}
