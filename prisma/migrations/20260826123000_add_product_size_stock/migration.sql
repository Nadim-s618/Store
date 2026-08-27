CREATE TYPE "ProductSize" AS ENUM ('S', 'M', 'L', 'XL', 'XXL');

CREATE TABLE "ProductSizeStock" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "size" "ProductSize" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductSizeStock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductSizeStock_productId_size_key" ON "ProductSizeStock"("productId", "size");
CREATE INDEX "ProductSizeStock_productId_idx" ON "ProductSizeStock"("productId");

ALTER TABLE "ProductSizeStock"
ADD CONSTRAINT "ProductSizeStock_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProductSizeStock" ("id", "productId", "size", "quantity")
SELECT 'legacy-' || "id", "id", 'M'::"ProductSize", "stock"
FROM "Product"
WHERE "stock" > 0;
