
-- Expand product_type to include recycling material types
ALTER TABLE public.products DROP CONSTRAINT products_product_type_check;
ALTER TABLE public.products ADD CONSTRAINT products_product_type_check
  CHECK (product_type = ANY (ARRAY[
    'raw', 'compound', 'processed',
    'black_mass', 'recycled_lithium', 'cathode_scrap', 'anode_scrap', 'electrolyte_recovery'
  ]));

-- Expand availability to include more statuses
ALTER TABLE public.products DROP CONSTRAINT products_availability_check;
ALTER TABLE public.products ADD CONSTRAINT products_availability_check
  CHECK (availability = ANY (ARRAY[
    'in-stock', 'limited', 'contact',
    'pre-order', 'out-of-stock'
  ]));

-- Expand purity_level to allow recycling-grade descriptions
ALTER TABLE public.products DROP CONSTRAINT products_purity_level_check;
ALTER TABLE public.products ADD CONSTRAINT products_purity_level_check
  CHECK (purity_level = ANY (ARRAY[
    '99', '99.5', '99.9',
    'battery-grade', 'technical-grade', 'industrial-grade'
  ]));
