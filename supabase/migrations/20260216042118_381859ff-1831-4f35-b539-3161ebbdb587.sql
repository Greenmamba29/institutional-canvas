
-- Seed 10 recycling marketplace products
INSERT INTO public.products (supplier_id, name, product_type, purity_level, price_per_unit, currency, unit, min_order_quantity, availability, has_bulk_discount, bulk_discount_percentage, org_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Premium Black Mass (NMC)', 'black_mass', 'battery-grade', 8500, 'USD', 'MT', 5, 'in-stock', true, 8, '7cdcbe2b-6aa4-4ea1-803c-dfcf52fccbbc'),
  ('11111111-1111-1111-1111-111111111111', 'Standard Black Mass (LFP)', 'black_mass', 'technical-grade', 4200, 'USD', 'MT', 10, 'in-stock', false, NULL, '7cdcbe2b-6aa4-4ea1-803c-dfcf52fccbbc'),
  ('11111111-1111-1111-1111-111111111111', 'Recycled Lithium Carbonate', 'recycled_lithium', '99.5', 14500, 'USD', 'MT', 2, 'limited', true, 5, '67f102e7-9686-4c20-8246-dbb7c4040b36'),
  ('11111111-1111-1111-1111-111111111111', 'Recycled Lithium Hydroxide', 'recycled_lithium', '99.9', 16800, 'USD', 'MT', 1, 'in-stock', false, NULL, '67f102e7-9686-4c20-8246-dbb7c4040b36'),
  ('11111111-1111-1111-1111-111111111111', 'NMC Cathode Scrap', 'cathode_scrap', 'battery-grade', 6200, 'USD', 'MT', 5, 'in-stock', true, 10, '3878b893-3c26-49ef-b79c-c7823a3be4f7'),
  ('11111111-1111-1111-1111-111111111111', 'LFP Cathode Scrap', 'cathode_scrap', 'industrial-grade', 3100, 'USD', 'MT', 10, 'limited', false, NULL, '3878b893-3c26-49ef-b79c-c7823a3be4f7'),
  ('11111111-1111-1111-1111-111111111111', 'Copper Anode Scrap', 'anode_scrap', '99.9', 7800, 'USD', 'MT', 3, 'in-stock', true, 7, '7cdcbe2b-6aa4-4ea1-803c-dfcf52fccbbc'),
  ('11111111-1111-1111-1111-111111111111', 'Graphite Anode Scrap', 'anode_scrap', '99.5', 2400, 'USD', 'MT', 5, 'pre-order', false, NULL, '67f102e7-9686-4c20-8246-dbb7c4040b36'),
  ('11111111-1111-1111-1111-111111111111', 'DMC Electrolyte Recovery', 'electrolyte_recovery', 'technical-grade', 3600, 'EUR', 'MT', 2, 'limited', false, NULL, '3878b893-3c26-49ef-b79c-c7823a3be4f7'),
  ('11111111-1111-1111-1111-111111111111', 'LiPF6 Salt Recovery', 'electrolyte_recovery', 'industrial-grade', 28000, 'USD', 'MT', 1, 'pre-order', true, 12, '7cdcbe2b-6aa4-4ea1-803c-dfcf52fccbbc')
ON CONFLICT DO NOTHING;
