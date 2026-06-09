/**
 * SkillRecommendations
 * 
 * Displays contextual skill recommendations based on the current page
 * and user actions. Uses the skill discovery engine.
 */

import React from 'react';
import { useSkillRecommendations } from '@/hooks/useSkillRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  getSkillDisplayName,
  getPriorityLabel,
  getPriorityChipClasses,
} from './skillDisplay';

interface SkillRecommendationsProps {
  maxItems?: number;
  compact?: boolean;
}

const SKILL_ROUTES: Record<string, string> = {
  'telebuy.start': '/telebuy',
  'telebuy.list': '/telebuy',
  'rfq.create': '/rfqs',
  'rfq.list': '/rfqs',
  'rfq.respond': '/rfqs',
  'auction.bid': '/auctions',
  'auction.list': '/auctions',
  'auction.settle': '/auctions',
};

export function SkillRecommendations({ 
  maxItems = 3, 
  compact = false 
}: SkillRecommendationsProps) {
  const { recommendations, isLoading } = useSkillRecommendations();
  const navigate = useNavigate();

  if (isLoading || recommendations.length === 0) {
    return null;
  }

  const displayItems = recommendations.slice(0, maxItems);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {displayItems.map((rec) => (
          <Button
            key={rec.skillName}
            variant="outline"
            size="sm"
            onClick={() => navigate(SKILL_ROUTES[rec.skillName] || '/dashboard')}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            {getSkillDisplayName(rec.skillName, rec.displayName)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Suggested Actions
        </CardTitle>
        <CardDescription>
          Based on your current context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.map((rec) => (
          <div
            key={rec.skillName}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {getSkillDisplayName(rec.skillName, rec.displayName)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none',
                    getPriorityChipClasses(rec.priority)
                  )}
                >
                  {getPriorityLabel(rec.priority)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {rec.reason}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(SKILL_ROUTES[rec.skillName] || '/dashboard')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
