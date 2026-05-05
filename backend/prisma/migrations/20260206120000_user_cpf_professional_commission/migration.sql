-- Align database with schema (User.cpf, Professional.commissionPct)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_cpf_key" ON "users"("cpf");

ALTER TABLE "professionals" ADD COLUMN IF NOT EXISTS "commissionPct" DECIMAL(5, 2) NOT NULL DEFAULT 40;
