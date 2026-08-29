CREATE INDEX "Product_isTopCollection_topCollectionOrder_createdAt_idx"
ON "Product"("isTopCollection", "topCollectionOrder", "createdAt");

CREATE INDEX "Product_isNewArrival_newArrivalOrder_createdAt_idx"
ON "Product"("isNewArrival", "newArrivalOrder", "createdAt");
