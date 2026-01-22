/**
 * OrganizationSetup - Create or join organization step
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Users, 
  ArrowRight,
  Loader2,
  Info,
  Landmark,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { UserRole } from './RoleSelection';

type SetupMode = 'choice' | 'create' | 'join';

interface OrganizationSetupProps {
  selectedRole: UserRole;
  isSubmitting: boolean;
  onCreateOrg: (data: CreateOrgData) => Promise<void>;
  onJoinOrg: (data: JoinOrgData) => Promise<void>;
}

export interface CreateOrgData {
  name: string;
  orgType: UserRole;
  governmentId?: string;
  jurisdiction?: string;
  soeCategory?: string;
  parentMinistry?: string;
}

export interface JoinOrgData {
  orgId: string;
  inviteToken?: string;
}

export function OrganizationSetup({ 
  selectedRole, 
  isSubmitting, 
  onCreateOrg, 
  onJoinOrg 
}: OrganizationSetupProps) {
  const [mode, setMode] = useState<SetupMode>('choice');
  
  // Create org form state
  const [orgName, setOrgName] = useState('');
  const [governmentId, setGovernmentId] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [soeCategory, setSoeCategory] = useState('');
  const [parentMinistry, setParentMinistry] = useState('');
  
  // Join org form state
  const [orgId, setOrgId] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    
    await onCreateOrg({
      name: orgName.trim(),
      orgType: selectedRole,
      ...(selectedRole === 'soe' && {
        governmentId: governmentId.trim() || undefined,
        jurisdiction: jurisdiction.trim() || undefined,
        soeCategory: soeCategory || undefined,
        parentMinistry: parentMinistry.trim() || undefined,
      }),
    });
  };

  const handleJoin = async () => {
    if (!orgId.trim()) return;
    
    await onJoinOrg({
      orgId: orgId.trim(),
      inviteToken: inviteToken.trim() || undefined,
    });
  };

  if (mode === 'choice') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Set Up Your Organization</h2>
          <p className="text-muted-foreground text-sm">
            Create a new organization or join an existing one
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setMode('create')}
            className="glass-panel p-6 rounded-xl text-left hover:border-primary/50 transition-all group"
          >
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Create Organization</h3>
            <p className="text-sm text-muted-foreground">
              Set up a new company account for your team
            </p>
          </button>

          <button
            onClick={() => setMode('join')}
            className="glass-panel p-6 rounded-xl text-left hover:border-accent/50 transition-all group"
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
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setMode('choice')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to options
        </button>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Create Your Organization</h2>
          <p className="text-muted-foreground text-sm">
            You'll be the owner with full admin access
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
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              This will be visible to other traders on the platform
            </p>
          </div>

          {/* SOE-specific fields */}
          {selectedRole === 'soe' && (
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
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Input
                    id="jurisdiction"
                    placeholder="e.g., Chile, Argentina"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soeCategory">Category</Label>
                  <Select value={soeCategory} onValueChange={setSoeCategory} disabled={isSubmitting}>
                    <SelectTrigger>
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={isSubmitting || !orgName.trim() || (selectedRole === 'soe' && (!governmentId.trim() || !jurisdiction.trim()))}
            className="w-full h-12"
          >
            {isSubmitting ? (
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
      </div>
    );
  }

  // Join mode
  return (
    <div className="space-y-6">
      <button
        onClick={() => setMode('choice')}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to options
      </button>

      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-accent/10 mx-auto mb-4 flex items-center justify-center">
          <Users className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Join an Organization</h2>
        <p className="text-muted-foreground text-sm">
          Enter your organization ID or invite token
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgId">Organization ID</Label>
          <Input
            id="orgId"
            placeholder="e.g., org_abc123"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-12"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inviteToken">Invite Token (Optional)</Label>
          <Input
            id="inviteToken"
            placeholder="Paste your invite token"
            value={inviteToken}
            onChange={(e) => setInviteToken(e.target.value)}
            className="h-12"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            If you received an invite link, paste the token here
          </p>
        </div>

        <Button
          onClick={handleJoin}
          disabled={isSubmitting || !orgId.trim()}
          className="w-full h-12"
        >
          {isSubmitting ? (
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
    </div>
  );
}
