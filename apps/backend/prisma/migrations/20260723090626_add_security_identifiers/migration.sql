-- AlterTable
ALTER TABLE "holdings" ADD COLUMN     "exchange" VARCHAR(20) NOT NULL DEFAULT 'NSE',
ADD COLUMN     "identifier_type" VARCHAR(20) NOT NULL DEFAULT 'TICKER';
