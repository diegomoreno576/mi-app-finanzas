-- Finanzas personales: esquema inicial con RLS

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7c3aed',
  icon TEXT NOT NULL DEFAULT 'circle',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

CREATE INDEX categories_user_id_type_idx ON public.categories (user_id, type);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transactions_user_id_date_idx ON public.transactions (user_id, date DESC);

-- Budgets
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  year INT NOT NULL CHECK (year >= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month, year)
);

CREATE INDEX budgets_user_id_year_month_idx ON public.budgets (user_id, year, month);

-- Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
  ON public.categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own transactions"
  ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own budgets"
  ON public.budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Default categories on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, type) VALUES
    (NEW.id, 'Alimentación', '#ef4444', 'utensils', 'expense'),
    (NEW.id, 'Transporte', '#3b82f6', 'car', 'expense'),
    (NEW.id, 'Vivienda', '#8b5cf6', 'home', 'expense'),
    (NEW.id, 'Salud', '#10b981', 'heart-pulse', 'expense'),
    (NEW.id, 'Ocio', '#f59e0b', 'gamepad-2', 'expense'),
    (NEW.id, 'Ropa', '#ec4899', 'shirt', 'expense'),
    (NEW.id, 'Educación', '#06b6d4', 'graduation-cap', 'expense'),
    (NEW.id, 'Otros', '#6b7280', 'more-horizontal', 'expense'),
    (NEW.id, 'Salario', '#22c55e', 'briefcase', 'income'),
    (NEW.id, 'Freelance', '#14b8a6', 'laptop', 'income'),
    (NEW.id, 'Inversiones', '#a855f7', 'trending-up', 'income'),
    (NEW.id, 'Otros', '#6b7280', 'circle-dollar-sign', 'income');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
