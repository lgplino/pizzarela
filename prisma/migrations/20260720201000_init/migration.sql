-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "adminPin" TEXT NOT NULL,
    "maxPerDay" INTEGER NOT NULL DEFAULT 2,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "blockedWeekdays" TEXT NOT NULL DEFAULT '[]',
    "preferredWeekdays" TEXT NOT NULL DEFAULT '[]',
    "fixedWeekday" INTEGER,
    "blockedDates" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapLog" (
    "id" TEXT NOT NULL,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "dateABefore" TEXT NOT NULL,
    "dateBBefore" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SwapLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Assignment_monthKey_idx" ON "Assignment"("monthKey");

-- CreateIndex
CREATE INDEX "Assignment_date_idx" ON "Assignment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_personId_date_key" ON "Assignment"("personId", "date");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapLog" ADD CONSTRAINT "SwapLog_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapLog" ADD CONSTRAINT "SwapLog_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
