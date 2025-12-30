-- Create Condition enum type
DO $$ BEGIN
    CREATE TYPE "Condition" AS ENUM ('NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_WORK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS "inventory_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "mileage" INTEGER,
    "hours" INTEGER,
    "year" INTEGER NOT NULL,
    "condition" "Condition" NOT NULL
);

-- Create images table
CREATE TABLE IF NOT EXISTS "images" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "images_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

-- Create trigger function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updatedAt
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON "inventory_items";
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON "inventory_items"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_images_updated_at ON "images";
CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON "images"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

