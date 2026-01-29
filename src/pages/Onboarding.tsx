/**
 * Onboarding Page - Comprehensive multi-step onboarding wizard
 * 
 * Steps:
 * 1. Welcome - Introduction to the platform
 * 2. Role Selection - Choose buyer/supplier/soe (saves to onboarding_profiles)
 * 3. Organization Setup - Create or join an organization
 * 4. Feature Tour - Interactive walkthrough of features
 * 
 * IMPORTANT: Role selection is now IMMUTABLE once saved to onboarding_profiles.
 * The profile determines user capabilities via the profile_capabilities junction table.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { useCreateOrganization, useClaimMembership } from '@/hooks/useOrganizations';
import { useUserProfile } from '@/hooks/useCapability';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';
import {
  OnboardingProgress,
  WelcomeStep,
  RoleSelection,
  OrganizationSetup,
  FeatureTour,
  type UserRole,
  type CreateOrgData,
  type JoinOrgData,
  type OnboardingStep,
} from '@/components/onboarding';

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'welcome', title: 'Welcome', description: 'Get started' },
  { id: 'role', title: 'Your Role', description: 'Select role' },
  { id: 'organization', title: 'Organization', description: 'Setup org' },
  { id: 'tour', title: 'Tour', description: 'Explore features' },
];

// Map UI role to database profile type
const roleToProfileType = (role: UserRole): 'buyer' | 'supplier' | 'soe' | 'investor' => {
  switch (role) {
    case 'buyer': return 'buyer';
    case 'supplier': return 'supplier';
    case 'soe': return 'soe';
    default: return 'buyer';
  }
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { refetch } = useOrganization();
  const createOrg = useCreateOrganization();
  const claimMembership = useClaimMembership();
  const { data: existingProfile, isLoading: profileLoading } = useUserProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrgName, setCreatedOrgName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // If user already has an onboarding profile, skip to org step or dashboard
  useEffect(() => {
    if (existingProfile && !profileLoading) {
      // User already completed role selection - profile is immutable
      // existingProfile is already the profile type string (e.g., 'buyer')
      setSelectedRole(existingProfile as UserRole);
      // Skip welcome and role steps, go to organization
      setCurrentStep(2);
    }
  }, [existingProfile, profileLoading]);

  // Step navigation
  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
  }, []);

  const goToPrevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  // Handle organization creation
  const handleCreateOrg = useCallback(async (data: CreateOrgData) => {
    try {
      await createOrg.mutateAsync({
        name: data.name,
        orgType: data.orgType,
        email: user?.email,
        governmentId: data.governmentId,
        jurisdiction: data.jurisdiction,
        soeCategory: data.soeCategory,
        parentMinistry: data.parentMinistry,
      });
      
      setCreatedOrgName(data.name);
      setShowSuccess(true);
      toast.success('Organization created successfully!');
      refetch();
      
      // Move to feature tour after brief success display
      setTimeout(() => {
        setShowSuccess(false);
        goToNextStep();
      }, 2000);
    } catch (error) {
      toast.error('Failed to create organization. Please try again.');
      console.error('Create org error:', error);
    }
  }, [createOrg, user?.email, refetch, goToNextStep]);

  // Handle joining organization
  const handleJoinOrg = useCallback(async (data: JoinOrgData) => {
    try {
      await claimMembership.mutateAsync({
        orgId: data.orgId,
        inviteToken: data.inviteToken,
      });
      
      toast.success('Successfully joined organization!');
      refetch();
      goToNextStep();
    } catch (error) {
      toast.error('Failed to join organization. Check your invite details.');
      console.error('Join org error:', error);
    }
  }, [claimMembership, refetch, goToNextStep]);

  // Handle role selection (does NOT save yet - saving happens on Continue)
  const handleRoleSelect = useCallback((role: UserRole) => {
    setSelectedRole(role);
  }, []);

  // Save profile to database when continuing from role selection
  const handleRoleContinue = useCallback(async () => {
    if (!selectedRole || !user?.id) return;
    
    // Check if profile already exists (immutable)
    if (existingProfile) {
      goToNextStep();
      return;
    }

    setIsSavingProfile(true);
    try {
      const profileType = roleToProfileType(selectedRole);
      
      // Insert into onboarding_profiles (immutable - locked by default)
      const { error } = await supabase
        .from('onboarding_profiles')
        .insert({
          user_id: user.id,
          profile: profileType,
          declared_intent: { 
            selected_at: new Date().toISOString(),
            initial_role: selectedRole 
          },
          locked: true, // Profile is immediately locked
        });

      if (error) {
        // If duplicate key, profile already exists
        if (error.code === '23505') {
          toast.info('Profile already set. Continuing...');
        } else {
          throw error;
        }
      } else {
        toast.success(`Profile set to ${selectedRole}`);
      }
      
      goToNextStep();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  }, [selectedRole, user?.id, existingProfile, goToNextStep]);

  // Handle completing feature tour
  const handleTourComplete = useCallback(() => {
    toast.success('Setup complete! Welcome to LithiumBuy.');
    navigate('/dashboard');
  }, [navigate]);

  // Handle skipping feature tour
  const handleSkipTour = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // Success Modal - shown after org creation
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 ambient-bg">
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
                <span className="text-foreground font-medium">{createdOrgName}</span> is ready.
                <br />Let's show you around...
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

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <WelcomeStep
            userEmail={user?.email}
            onContinue={goToNextStep}
            onLogout={logout}
          />
        );
      
      case 1: // Role Selection
        return (
          <div className="space-y-6">
            <RoleSelection
              selectedRole={selectedRole}
              onSelectRole={handleRoleSelect}
            />
            {existingProfile && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Your profile is already set to <span className="text-foreground font-medium">{existingProfile}</span>. 
                  This cannot be changed.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={goToPrevStep}
                className="flex-1 h-12 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleRoleContinue}
                disabled={!selectedRole || isSavingProfile}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {isSavingProfile ? 'Saving...' : existingProfile ? 'Continue' : 'Set Profile & Continue'}
              </button>
            </div>
          </div>
        );
      
      case 2: // Organization Setup
        return (
          <div className="space-y-6">
            <OrganizationSetup
              selectedRole={selectedRole || 'buyer'}
              isSubmitting={createOrg.isPending || claimMembership.isPending}
              onCreateOrg={handleCreateOrg}
              onJoinOrg={handleJoinOrg}
            />
            <div className="text-center">
              <button
                onClick={goToPrevStep}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to role selection
              </button>
            </div>
          </div>
        );
      
      case 3: // Feature Tour
        return (
          <FeatureTour
            userRole={selectedRole || 'buyer'}
            onComplete={handleTourComplete}
            onSkip={handleSkipTour}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 ambient-bg">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-gold">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          
          {/* Progress indicator - show after welcome step */}
          {currentStep > 0 && (
            <div className="max-w-md mx-auto mb-6">
              <OnboardingProgress steps={ONBOARDING_STEPS} currentStep={currentStep} />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="glass-panel rounded-2xl p-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
