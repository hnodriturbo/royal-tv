/*
  Warnings:

  - A unique constraint covering the columns `[payment_id]` on the table `SubscriptionPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SubscriptionPayment_invoice_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_payment_id_key" ON "SubscriptionPayment"("payment_id");
