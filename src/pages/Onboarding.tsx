import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useCreateOrganization, useClaimMembership } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Building2, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Package,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

type Step = 'choice' | 'create' | 'join';
type OrgType = 'buyer' | 'supplier';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { refetch } = useOrganization();
  const createOrg = useCreateOrganization();
  const claimMembership = useClaimMembership();

  const [step, setStep] = useState<Step>('choice');
  const [orgType, setOrgType] = useState<OrgType>('buyer');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    try {
      await createOrg.mutateAsync({
        name: orgName.trim(),
        orgType,
        email: user?.email,
      });
      
      toast.success('Organization created successfully!');
      refetch();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to create organization. Please try again.');
      console.error('Create org error:', error);
    }
  };

  const handleJoinOrg = async () => {
    if (!orgId.trim()) {
      toast.error('Please enter an organization ID');
      return;
    }

    try {
      await claimMembership.mutateAsync({
        orgId: orgId.trim(),
        inviteToken: inviteToken.trim() || undefined,
      });
      
      toast.success('Successfully joined organization!');
      refetch();
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to join organization. Check your invite details.');
      console.error('Join org error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-gold">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Lithium & Lux</h1>
          <p className="text-muted-foreground">
            {user?.email && `Signed in as ${user.email}`}
          </p>
        </div>

        {step === 'choice' && (
          <div className="glass-panel rounded-2xl p-8 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Get Started</h2>
              <p className="text-muted-foreground">
                Create a new organization or join an existing one
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setStep('create')}
                className="glass-panel p-6 rounded-xl text-left hover:border-primary/50 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Create Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Set up a new company account for buying or selling
                </p>
              </button>

              <button
                onClick={() => setStep('join')}
                className="glass-panel p-6 rounded-xl text-left hover:border-primary/50 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold mb-1">Join Organization</h3>
                <p className="text-sm text-muted-foreground">
                  Join your team's existing organization
                </p>
              </button>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out and use a different account
              </button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="glass-panel rounded-2xl p-8 space-y-6">
            <button
              onClick={() => setStep('choice')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h2 className="text-xl font-semibold mb-2">Create Your Organization</h2>
              <p className="text-muted-foreground">
                Set up your company to start trading on the platform
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Enter your company name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-3">
                <Label>Organization Type</Label>
                <RadioGroup
                  value={orgType}
                  onValueChange={(v) => setOrgType(v as OrgType)}
                  className="grid grid-cols-2 gap-4"
                >
                  <label
                    htmlFor="buyer"
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      orgType === 'buyer' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value="buyer" id="buyer" />
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Buyer</p>
                        <p className="text-xs text-muted-foreground">Purchase materials</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="supplier"
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      orgType === 'supplier' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value="supplier" id="supplier" />
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">Supplier</p>
                        <p className="text-xs text-muted-foreground">Sell materials</p>
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <Button
              onClick={handleCreateOrg}
              disabled={createOrg.isPending || !orgName.trim()}
              className="w-full h-12"
            >
              {createOrg.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'join' && (
          <div className="glass-panel rounded-2xl p-8 space-y-6">
            <button
              onClick={() => setStep('choice')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h2 className="text-xl font-semibold mb-2">Join an Organization</h2>
              <p className="text-muted-foreground">
                Enter your organization details to join your team
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgId">Organization ID</Label>
                <Input
                  id="orgId"
                  placeholder="Enter organization ID"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="h-12 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Get this from your organization admin
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteToken">Invite Token (Optional)</Label>
                <Input
                  id="inviteToken"
                  placeholder="Enter invite token if you have one"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  className="h-12 font-mono"
                />
              </div>
            </div>

            <Button
              onClick={handleJoinOrg}
              disabled={claimMembership.isPending || !orgId.trim()}
              className="w-full h-12"
            >
              {claimMembership.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  Join Organization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
