CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'Default',
    "size" "ProductSize" NOT NULL DEFAULT 'M',
    "quantityChange" INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryAdjustment_productId_createdAt_idx" ON "InventoryAdjustment"("productId", "createdAt");
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
