-- Evita regenerar fijos/cuotas cuando el usuario borra la transacción manualmente

CREATE TABLE public.recurring_month_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recurring_id, month, year)
);

CREATE INDEX recurring_month_skips_user_month_idx
  ON public.recurring_month_skips (user_id, year, month);

CREATE TABLE public.installment_payment_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_number INT NOT NULL CHECK (installment_number >= 1),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (installment_id, installment_number)
);

CREATE INDEX installment_payment_skips_user_idx
  ON public.installment_payment_skips (user_id);

ALTER TABLE public.recurring_month_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payment_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring skips"
  ON public.recurring_month_skips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own installment skips"
  ON public.installment_payment_skips
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
