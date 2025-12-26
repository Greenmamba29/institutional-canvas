import { useState } from 'react';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { useOrganization } from '@/context/OrganizationContext';
import { useOrgMembers, useInviteOrgMember } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Users, 
  Mail, 
  Shield, 
  UserPlus,
  Loader2,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const roleBadgeColors: Record<string, string> = {
  owner: 'bg-accent/20 text-accent border-accent/30',
  admin: 'bg-primary/20 text-primary border-primary/30',
  member: 'bg-secondary text-foreground border-border',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export default function Team() {
  const { currentOrg } = useOrganization();
  const { data: members, isLoading } = useOrgMembers(currentOrg?.id);
  const inviteMember = useInviteOrgMember();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentOrg) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await inviteMember.mutateAsync({
        orgId: currentOrg.id,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error('Invite error:', error);
    }
  };

  const copyOrgId = () => {
    if (currentOrg?.id) {
      navigator.clipboard.writeText(currentOrg.id);
      setCopiedOrgId(true);
      toast.success('Organization ID copied');
      setTimeout(() => setCopiedOrgId(false), 2000);
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <PageHeader
          title="Team Management"
          description={`Manage team members for ${currentOrg?.name || 'your organization'}`}
          actions={
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {currentOrg?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                        <SelectItem value="member">Member - Standard access</SelectItem>
                        <SelectItem value="viewer">Viewer - Read-only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviteMember.isPending}>
                    {inviteMember.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Organization Info Card */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">{currentOrg?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Organization ID: <span className="font-mono">{currentOrg?.id?.slice(0, 8)}...</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyOrgId} className="gap-2">
              {copiedOrgId ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy ID
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Members List */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </h3>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="divide-y divide-border">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                      {member.user_id?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{member.user_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.created_at 
                          ? `Joined ${format(new Date(member.created_at), 'MMM d, yyyy')}`
                            : 'Member'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${roleBadgeColors[member.role] || roleBadgeColors.member}`}>
                      {roleLabels[member.role] || member.role}
                    </span>
                    {member.role === 'owner' && (
                      <Shield className="h-4 w-4 text-accent" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
              <p className="text-muted-foreground mb-6">
                Invite colleagues to collaborate on your organization.
              </p>
              <Button onClick={() => setInviteDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite First Member
              </Button>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
