ALTER TABLE "Order" ADD COLUMN "inventoryDecremented" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OrderItem" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'Default';
ALTER TABLE "OrderItem" ADD COLUMN "size" "ProductSize" NOT NULL DEFAULT 'M';
