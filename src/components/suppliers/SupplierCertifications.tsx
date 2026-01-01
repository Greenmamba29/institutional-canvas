import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, ExternalLink, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Certification {
  id: string;
  certification_type: string;
  certification_number: string | null;
  issued_by: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
}

interface SupplierCertificationsProps {
  certifications: Certification[];
}

export function SupplierCertifications({ certifications }: SupplierCertificationsProps) {
  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiry = new Date(date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry > new Date() && expiry < threeMonthsFromNow;
  };

  if (certifications.length === 0) {
    return (
      <Card className="glass-panel border-border/50">
        <CardContent className="p-8 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No certifications</h3>
          <p className="text-muted-foreground">
            This supplier hasn't uploaded any certifications yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {certifications.map((cert) => (
        <Card key={cert.id} className="glass-panel border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold">{cert.certification_type}</h3>
                  {cert.expiry_date && (
                    <Badge
                      variant="outline"
                      className={
                        isExpired(cert.expiry_date)
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : isExpiringSoon(cert.expiry_date)
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                      }
                    >
                      {isExpired(cert.expiry_date)
                        ? "Expired"
                        : isExpiringSoon(cert.expiry_date)
                        ? "Expiring Soon"
                        : "Active"}
                    </Badge>
                  )}
                </div>

                {cert.certification_number && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Certificate #: <span className="font-mono">{cert.certification_number}</span>
                  </p>
                )}

                {cert.issued_by && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Issued by: {cert.issued_by}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {cert.issued_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Issued: {format(new Date(cert.issued_date), "MMM yyyy")}
                    </span>
                  )}
                  {cert.expiry_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {format(new Date(cert.expiry_date), "MMM yyyy")}
                    </span>
                  )}
                </div>

                {cert.certificate_url && (
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Certificate
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
