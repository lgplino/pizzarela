-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "adminPin" TEXT NOT NULL,
    "maxPerDay" INTEGER NOT NULL DEFAULT 2
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "blockedWeekdays" TEXT NOT NULL DEFAULT '[]',
    "preferredWeekdays" TEXT NOT NULL DEFAULT '[]',
    "fixedWeekday" INTEGER,
    "blockedDates" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwapLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personAId" TEXT NOT NULL,
    "personBId" TEXT NOT NULL,
    "dateABefore" TEXT NOT NULL,
    "dateBBefore" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undone" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SwapLog_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SwapLog_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Assignment_monthKey_idx" ON "Assignment"("monthKey");

-- CreateIndex
CREATE INDEX "Assignment_date_idx" ON "Assignment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_personId_date_key" ON "Assignment"("personId", "date");
