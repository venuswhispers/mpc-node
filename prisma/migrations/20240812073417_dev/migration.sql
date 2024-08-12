-- CreateTable
CREATE TABLE "TeleportData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "txId" TEXT NOT NULL,
    "chainType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "evmSenderAddress" BOOLEAN,
    "sig" BOOLEAN,
    "hashedTxId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "TeleportData_txId_key" ON "TeleportData"("txId");
