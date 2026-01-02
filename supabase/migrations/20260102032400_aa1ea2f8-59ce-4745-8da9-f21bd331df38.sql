-- Insert the 5 real lithium suppliers with their specific org_ids
-- These UUIDs match the certifications and reviews already in the database

INSERT INTO suppliers (org_id, display_name, verification_tier, capabilities, public_profile) VALUES
('11111111-1111-1111-1111-111111111111', 'Albemarle Corporation', 'gold', 
 '{"products": ["lithium_hydroxide", "lithium_carbonate"], "capacity_mt": 200000}'::jsonb,
 '{"description": "World leading lithium producer", "founded": 1994, "headquarters": "Charlotte, NC, USA"}'::jsonb),
 
('22222222-2222-2222-2222-222222222222', 'SQM (Sociedad Quimica y Minera)', 'gold',
 '{"products": ["lithium_carbonate", "lithium_hydroxide"], "capacity_mt": 180000}'::jsonb,
 '{"description": "Chilean mining company, Atacama brine operations", "founded": 1968, "headquarters": "Santiago, Chile"}'::jsonb),

('33333333-3333-3333-3333-333333333333', 'Ganfeng Lithium', 'gold',
 '{"products": ["lithium_metal", "lithium_hydroxide", "lithium_carbonate"], "capacity_mt": 150000}'::jsonb,
 '{"description": "Largest lithium producer in China", "founded": 2000, "headquarters": "Xinyu, China"}'::jsonb),

('44444444-4444-4444-4444-444444444444', 'Tianqi Lithium', 'silver',
 '{"products": ["lithium_hydroxide", "lithium_carbonate"], "capacity_mt": 100000}'::jsonb,
 '{"description": "Chinese lithium giant with Australian assets", "founded": 1995, "headquarters": "Chengdu, China"}'::jsonb),

('55555555-5555-5555-5555-555555555555', 'Pilbara Minerals', 'silver',
 '{"products": ["spodumene_concentrate"], "capacity_mt": 580000}'::jsonb,
 '{"description": "Australian hard-rock lithium miner", "founded": 2005, "headquarters": "Perth, Australia"}'::jsonb)
ON CONFLICT (org_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  verification_tier = EXCLUDED.verification_tier,
  capabilities = EXCLUDED.capabilities,
  public_profile = EXCLUDED.public_profile;