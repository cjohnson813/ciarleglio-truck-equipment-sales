-- Indexes for inventory_items table
CREATE INDEX IF NOT EXISTS "inventory_items_category_idx" ON "inventory_items"("category");
CREATE INDEX IF NOT EXISTS "inventory_items_make_idx" ON "inventory_items"("make");
CREATE INDEX IF NOT EXISTS "inventory_items_model_idx" ON "inventory_items"("model");
CREATE INDEX IF NOT EXISTS "inventory_items_year_idx" ON "inventory_items"("year");
CREATE INDEX IF NOT EXISTS "inventory_items_condition_idx" ON "inventory_items"("condition");

-- Indexes for images table
CREATE INDEX IF NOT EXISTS "images_itemId_idx" ON "images"("itemId");
CREATE INDEX IF NOT EXISTS "images_orderIndex_idx" ON "images"("orderIndex");

