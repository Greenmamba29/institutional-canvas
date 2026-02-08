/**
 * CustodyEventCard - Individual event in the chain of custody timeline
 */

import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  Shield,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  type CustodyEvent, 
  type CustodyDocument,
  custodyEventConfig 
} from '@/services/custody.service';
import { cn } from '@/lib/utils';

interface CustodyEventCardProps {
  event: CustodyEvent;
  isLast?: boolean;
  isActive?: boolean;
}

const documentTypeLabels: Record<CustodyDocument['type'], string> = {
  certificate: 'Certificate',
  bill_of_lading: 'Bill of Lading',
  inspection_report: 'Inspection Report',
  customs: 'Customs Doc',
  other: 'Document',
};

export function CustodyEventCard({ event, isLast = false, isActive = false }: CustodyEventCardProps) {
  const config = custodyEventConfig[event.eventType];
  const isVerified = !!event.verifiedBy;
  
  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div 
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border-2",
            isActive ? "border-primary bg-primary/10" : "border-muted bg-background",
            isVerified && "border-green-500 bg-green-500/10"
          )}
        >
          {isVerified ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border my-2" />
        )}
      </div>
      
      {/* Event content */}
      <Card className={cn(
        "flex-1 mb-4 transition-colors",
        isActive && "border-primary/50 shadow-md"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <Badge variant="outline" className={cn(config.bgColor, config.color, "border-0")}>
                {config.label}
              </Badge>
              <CardTitle className="text-base">{event.title}</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(event.timestamp), 'MMM d, yyyy')}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {event.description}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
            {event.coordinates && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                <a 
                  href={`https://maps.google.com/?q=${event.coordinates.lat},${event.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Map
                </a>
              </Button>
            )}
          </div>
          
          {/* Verification status */}
          {isVerified && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Shield className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <span className="font-medium text-green-700 dark:text-green-400">Verified by </span>
                <span className="text-muted-foreground">{event.verifiedBy}</span>
                {event.verifiedAt && (
                  <span className="text-xs text-muted-foreground ml-2">
                    on {format(new Date(event.verifiedAt), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Documents */}
          {event.documents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Documents ({event.documents.length})
                </div>
                <div className="grid gap-2">
                  {event.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {documentTypeLabels[doc.type]}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
