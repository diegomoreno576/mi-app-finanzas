-- Financiaciones a plazos y compras/favores (Amazon Aplázame, Pepper, etc.)

CREATE TABLE public.installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'other' CHECK (provider IN ('amazon', 'pepper', 'other')),
  purpose TEXT NOT NULL DEFAULT 'personal' CHECK (purpose IN ('personal', 'favor')),
  beneficiary_name TEXT,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount > 0),
  installment_amount NUMERIC(12, 2) NOT NULL CHECK (installment_amount > 0),
  installments_total INT NOT NULL CHECK (installments_total >= 1),
  installments_paid INT NOT NULL DEFAULT 0 CHECK (installments_paid >= 0),
  payment_day INT NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
  start_date DATE NOT NULL,
  reimbursement_amount NUMERIC(12, 2),
  reimbursement_status TEXT NOT NULL DEFAULT 'none'
    CHECK (reimbursement_status IN ('none', 'pending', 'partial', 'settled')),
  reimbursed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (reimbursed_amount >= 0),
  category TEXT NOT NULL DEFAULT 'Otros',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (installments_paid <= installments_total),
  CHECK (
    purpose = 'personal'
    OR (beneficiary_name IS NOT NULL AND beneficiary_name <> '')
  )
);

CREATE INDEX installment_plans_user_id_idx ON public.installment_plans (user_id);
CREATE INDEX installment_plans_user_active_idx ON public.installment_plans (user_id, is_active);

CREATE TABLE public.installment_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_number INT NOT NULL CHECK (installment_number >= 1),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2000),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (installment_id, installment_number)
);

CREATE INDEX installment_generations_user_month_idx
  ON public.installment_generations (user_id, year, month);

ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own installment plans"
  ON public.installment_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own installment generations"
  ON public.installment_generations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
