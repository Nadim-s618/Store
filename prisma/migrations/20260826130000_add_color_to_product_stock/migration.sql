ALTER TABLE "ProductSizeStock"
ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Default';

DROP INDEX "ProductSizeStock_productId_size_key";
CREATE UNIQUE INDEX "ProductSizeStock_productId_color_size_key" ON "ProductSizeStock"("productId", "color", "size");
