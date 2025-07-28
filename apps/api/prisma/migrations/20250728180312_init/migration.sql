-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "fromBlockId" TEXT NOT NULL,
    "toBlockId" TEXT NOT NULL,

    CONSTRAINT "Relation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relation_fromBlockId_toBlockId_type_key" ON "Relation"("fromBlockId", "toBlockId", "type");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_fromBlockId_fkey" FOREIGN KEY ("fromBlockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relation" ADD CONSTRAINT "Relation_toBlockId_fkey" FOREIGN KEY ("toBlockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
