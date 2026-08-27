CREATE TABLE "ProductSizeMeasurement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" "ProductSize" NOT NULL,
    "height" DECIMAL(6,2),
    "width" DECIMAL(6,2),
    CONSTRAINT "ProductSizeMeasurement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductSizeMeasurement_productId_size_key" ON "ProductSizeMeasurement"("productId", "size");
ALTER TABLE "ProductSizeMeasurement" ADD CONSTRAINT "ProductSizeMeasurement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
