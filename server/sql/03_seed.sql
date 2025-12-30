-- Seed data: Insert sample inventory items
-- Note: These items have no images initially. Images should be uploaded via the admin interface.

INSERT INTO "inventory_items" ("category", "subcategory", "make", "model", "mileage", "hours", "year", "condition") VALUES
('Trucks', 'Tractors', 'Peterbilt', '379', 125000, NULL, 2022, 'GOOD'),
('Equipment', 'Excavators', 'Caterpillar', '320 Excavator', NULL, 2500, 2021, 'EXCELLENT'),
('Trucks', 'Dump Trucks', 'Kenworth', 'T880', 95000, NULL, 2020, 'GOOD'),
('Equipment', 'Backhoes', 'John Deere', '310SL', NULL, 1200, 2023, 'LIKE_NEW'),
('Trucks', 'Box Trucks', 'Freightliner', 'M2 106', 145000, NULL, 2019, 'FAIR'),
('Equipment', 'Wheel Loaders', 'Volvo', 'L90H', NULL, 1800, 2022, 'EXCELLENT'),
('Trucks', 'Hooklifts', 'Mack', 'Granite', 110000, NULL, 2021, 'GOOD'),
('Equipment', 'Skid Steers', 'Bobcat', 'S770', NULL, 3200, 2020, 'GOOD')
ON CONFLICT DO NOTHING;

