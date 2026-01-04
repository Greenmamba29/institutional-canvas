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
  CheckCircle2,
  Info,
  Landmark,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Step = 'choice' | 'create' | 'join';
type OrgType = 'buyer' | 'supplier' | 'soe';

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
  const [showSuccess, setShowSuccess] = useState(false);
  
  // SOE-specific fields
  const [governmentId, setGovernmentId] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [soeCategory, setSoeCategory] = useState('');
  const [parentMinistry, setParentMinistry] = useState('');

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }

    // SOE-specific validation
    if (orgType === 'soe') {
      if (!governmentId.trim()) {
        toast.error('Government ID is required for State Owned Entities');
        return;
      }
      if (!jurisdiction.trim()) {
        toast.error('Jurisdiction is required for State Owned Entities');
        return;
      }
    }

    try {
      await createOrg.mutateAsync({
        name: orgName.trim(),
        orgType,
        email: user?.email,
        // SOE-specific fields
        ...(orgType === 'soe' && {
          governmentId: governmentId.trim(),
          jurisdiction: jurisdiction.trim(),
          soeCategory: soeCategory || undefined,
          parentMinistry: parentMinistry.trim() || undefined,
        }),
      });
      
      // Show success animation
      setShowSuccess(true);
      toast.success('Organization created successfully!');
      refetch();
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
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

  // Success Modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-success/10 animate-bounce">
                <CheckCircle2 className="h-16 w-16 text-success" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome aboard!</h2>
              <p className="text-muted-foreground">
                Your organization is ready. Redirecting to your dashboard...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Progress Indicator */}
            <div className="flex justify-center gap-2 mb-6">
              <div className="h-1.5 w-12 rounded-full bg-primary" />
              <div className="h-1.5 w-12 rounded-full bg-secondary" />
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                STEP 1 OF 2
              </div>
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

            {/* Progress Indicator */}
            <div className="flex justify-center gap-2">
              <div className="h-1.5 w-12 rounded-full bg-primary" />
              <div className="h-1.5 w-12 rounded-full bg-primary" />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                STEP 2 OF 2
              </div>
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
                  placeholder="e.g., Acme Battery Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  This will be visible to other traders on the platform
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Organization Type</Label>
                  <div className="group relative">
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="glass-panel rounded-lg p-3 w-72 text-xs text-muted-foreground">
                        <strong className="text-foreground">Buyer:</strong> Purchase materials, create RFQs, bid on auctions<br/>
                        <strong className="text-foreground mt-2 block">Supplier:</strong> List materials, respond to RFQs, create auctions<br/>
                        <strong className="text-foreground mt-2 block">SOE:</strong> Government entities for strategic procurement
                      </div>
                    </div>
                  </div>
                </div>
                <RadioGroup
                  value={orgType}
                  onValueChange={(v) => setOrgType(v as OrgType)}
                  className="grid grid-cols-3 gap-3"
                >
                  <label
                    htmlFor="buyer"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      orgType === 'buyer' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value="buyer" id="buyer" />
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Buyer</p>
                        <p className="text-[10px] text-muted-foreground">Purchase</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="supplier"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      orgType === 'supplier' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value="supplier" id="supplier" />
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-sm">Supplier</p>
                        <p className="text-[10px] text-muted-foreground">Sell</p>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="soe"
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      orgType === 'soe' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <RadioGroupItem value="soe" id="soe" />
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-sm">SOE</p>
                        <p className="text-[10px] text-muted-foreground">Government</p>
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* SOE-specific fields */}
              {orgType === 'soe' && (
                <div className="space-y-4 p-4 rounded-xl bg-success/5 border border-success/20">
                  <div className="flex items-center gap-2 text-success text-sm font-medium">
                    <Landmark className="h-4 w-4" />
                    State Owned Entity Details
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="governmentId">Government ID *</Label>
                      <Input
                        id="governmentId"
                        placeholder="e.g., GOV-2024-001"
                        value={governmentId}
                        onChange={(e) => setGovernmentId(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                      <Input
                        id="jurisdiction"
                        placeholder="e.g., Chile, Argentina"
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="soeCategory">Category</Label>
                      <Select value={soeCategory} onValueChange={setSoeCategory}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mining_authority">Mining Authority</SelectItem>
                          <SelectItem value="energy_ministry">Energy Ministry</SelectItem>
                          <SelectItem value="strategic_reserves">Strategic Reserves</SelectItem>
                          <SelectItem value="development_bank">Development Bank</SelectItem>
                          <SelectItem value="commodity_board">Commodity Board</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentMinistry">Parent Ministry</Label>
                      <Input
                        id="parentMinistry"
                        placeholder="e.g., Ministry of Energy"
                        value={parentMinistry}
                        onChange={(e) => setParentMinistry(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              )}
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
