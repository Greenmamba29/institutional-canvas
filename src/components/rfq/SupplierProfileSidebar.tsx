import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { CertificationTag } from '@/components/shared/CertificationTag';
import { CheckCircle, MapPin, RotateCcw, Shield } from 'lucide-react';

interface SupplierProfileSidebarProps {
  name: string;
  title: string;
  company: string;
  verificationTier: 'gold' | 'standard';
  kycVerified: boolean;
  purityGrade: number;
  recycledMaterial: string;
  trustScore: number;
  pricePerMT: number;
  origin: string;
  originFlag: string;
  certifications: string[];
  verificationPipeline: {
    name: string;
    status: 'approved' | 'in_review' | 'active';
  }[];
}

export function SupplierProfileSidebar({
  name,
  title,
  company,
  verificationTier,
  kycVerified,
  purityGrade,
  recycledMaterial,
  trustScore,
  pricePerMT,
  origin,
  originFlag,
  certifications,
  verificationPipeline,
}: SupplierProfileSidebarProps) {
  const statusColors = {
    approved: 'text-success',
    in_review: 'text-warning',
    active: 'text-success',
  };

  const statusLabels = {
    approved: 'APPROVED',
    in_review: 'IN REVIEW',
    active: 'ACTIVE',
  };

  return (
    <div className="glass-panel rounded-xl p-5 space-y-5">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-success-foreground" />
          </div>
        </div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <VerificationBadge tier={verificationTier} />
          {kycVerified && <VerificationBadge tier="kyc" />}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {title} • {company}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-border/30">
        <div>
          <p className="text-lg font-bold font-mono">{purityGrade}%</p>
          <p className="text-[10px] text-muted-foreground">PURITY GRADE</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{recycledMaterial}</p>
          <p className="text-[10px] text-muted-foreground">RECYCLED MAT.</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-accent">{trustScore}/100</p>
          <p className="text-[10px] text-muted-foreground">TRUST SCORE</p>
        </div>
      </div>

      {/* Price & Origin */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">PRICE/MT</p>
          <p className="text-xl font-bold font-mono">${pricePerMT.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">ORIGIN</p>
          <p className="font-semibold flex items-center gap-1 justify-end">
            <span className="text-lg">{originFlag}</span> {origin}
          </p>
        </div>
      </div>

      {/* Certifications */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-2">CERTIFICATIONS</p>
        <div className="flex flex-wrap gap-1">
          {certifications.map((cert) => (
            <CertificationTag key={cert} label={cert} />
          ))}
        </div>
      </div>

      {/* Verification Pipeline */}
      <div className="pt-3 border-t border-border/30">
        <div className="flex items-center gap-1 mb-3">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground tracking-wider">VERIFICATION PIPELINE</p>
        </div>
        <div className="space-y-2">
          {verificationPipeline.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {item.status === 'in_review' ? (
                  <RotateCcw className="h-3.5 w-3.5 text-warning animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <CheckCircle className={`h-3.5 w-3.5 ${statusColors[item.status]}`} />
                )}
                <span>{item.name}</span>
              </div>
              <span className={`text-[10px] font-semibold ${statusColors[item.status]}`}>
                {statusLabels[item.status]}
              </span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2 text-xs font-semibold text-center text-accent hover:bg-accent/10 rounded-lg transition-colors border border-accent/30">
          UPGRADE VERIFICATION TIER
        </button>
      </div>
    </div>
  );
}
