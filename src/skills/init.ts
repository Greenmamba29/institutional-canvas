/**
 * Skills Initialization
 * 
 * Auto-registers all domain skills when imported.
 * Import this file early in your app (e.g., main.tsx) to ensure
 * all skills are available in the registry.
 */

import { registerSkill } from './registry';
import type { Skill } from './types';

// TeleBuy Skills
import { telebuyStartSkill, telebuyListSkill } from './telebuy';

// RFQ Skills
import { rfqCreateSkill, rfqListSkill, rfqRespondSkill } from './rfq';

// Auction Skills
import { auctionBidSkill, auctionListSkill, auctionSettleSkill } from './auction';

// New automation skills (sourcing / telebuy / custody / market / grant)
import { rfqOrchestrateSkill } from './rfq/orchestrate';
import { bidToDealSkill } from './rfq/bid-to-deal';
import { auctionMonitorSkill } from './auction/monitor';
import { lbTelebuySessionSkill, lbTelebuySummarizeSkill } from './telebuy';
import { lbProcureCustodySkill } from './custody';
import { marketPulseSkill } from './market';
import { grantMatchSkill } from './grant';

// All skills to register
const skills: Skill<unknown, unknown>[] = [
  // TeleBuy
  telebuyStartSkill as Skill<unknown, unknown>,
  telebuyListSkill as Skill<unknown, unknown>,
  // RFQ
  rfqCreateSkill as Skill<unknown, unknown>,
  rfqListSkill as Skill<unknown, unknown>,
  rfqRespondSkill as Skill<unknown, unknown>,
  // Auction
  auctionBidSkill as Skill<unknown, unknown>,
  auctionListSkill as Skill<unknown, unknown>,
  auctionSettleSkill as Skill<unknown, unknown>,
  // Automation skills
  rfqOrchestrateSkill as Skill<unknown, unknown>,
  bidToDealSkill as Skill<unknown, unknown>,
  auctionMonitorSkill as Skill<unknown, unknown>,
  lbTelebuySessionSkill as Skill<unknown, unknown>,
  lbTelebuySummarizeSkill as Skill<unknown, unknown>,
  lbProcureCustodySkill as Skill<unknown, unknown>,
  marketPulseSkill as Skill<unknown, unknown>,
  grantMatchSkill as Skill<unknown, unknown>,
];

let initialized = false;

export function initializeSkills(): void {
  if (initialized) {
    return;
  }

  for (const skill of skills) {
    registerSkill(skill);
  }

  initialized = true;
  console.log(`[Skills] Registered ${skills.length} skills`);
}

// Auto-initialize on import
initializeSkills();
