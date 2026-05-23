-- Más financiadores, pago compartido y cuota propia

ALTER TABLE public.installment_plans
  ADD COLUMN IF NOT EXISTS my_installment_amount NUMERIC(12, 2)
    CHECK (my_installment_amount IS NULL OR my_installment_amount > 0);

ALTER TABLE public.installment_plans
  DROP CONSTRAINT IF EXISTS installment_plans_provider_check;

ALTER TABLE public.installment_plans
  ADD CONSTRAINT installment_plans_provider_check
  CHECK (provider IN (
    'amazon',
    'aplazame',
    'cofidis',
    'cetelem',
    'pepper',
    'klarna',
    'scalapay',
    'santander',
    'credit_card',
    'other'
  ));

ALTER TABLE public.installment_plans
  DROP CONSTRAINT IF EXISTS installment_plans_purpose_check;

ALTER TABLE public.installment_plans
  ADD CONSTRAINT installment_plans_purpose_check
  CHECK (purpose IN ('personal', 'favor', 'shared'));

ALTER TABLE public.installment_plans
  DROP CONSTRAINT IF EXISTS installment_plans_check;

ALTER TABLE public.installment_plans
  ADD CONSTRAINT installment_plans_check
  CHECK (
    purpose = 'personal'
    OR (beneficiary_name IS NOT NULL AND beneficiary_name <> '')
  );

UPDATE public.installment_plans
SET my_installment_amount = installment_amount
WHERE my_installment_amount IS NULL;
