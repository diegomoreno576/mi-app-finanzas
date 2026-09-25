-- Buckets 50/30/20 en categorías de gasto

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS bucket TEXT
  CHECK (bucket IS NULL OR bucket IN ('needs', 'wants', 'savings'));

COMMENT ON COLUMN public.categories.bucket IS
  'Clasificación 50/30/20: needs | wants | savings (solo gastos)';

-- Defaults por nombre para categorías de gasto existentes
UPDATE public.categories
SET bucket = 'needs'
WHERE type = 'expense'
  AND name IN ('Vivienda', 'Alimentación', 'Transporte', 'Salud', 'Educación')
  AND bucket IS NULL;

UPDATE public.categories
SET bucket = 'wants'
WHERE type = 'expense'
  AND name IN ('Ocio', 'Suscripciones', 'Ropa', 'Otros')
  AND bucket IS NULL;

-- Resto de gastos sin bucket → wants (fallback)
UPDATE public.categories
SET bucket = 'wants'
WHERE type = 'expense'
  AND bucket IS NULL;

-- Defaults para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon, type, bucket) VALUES
    (NEW.id, 'Alimentación', '#ef4444', 'utensils', 'expense', 'needs'),
    (NEW.id, 'Transporte', '#3b82f6', 'car', 'expense', 'needs'),
    (NEW.id, 'Vivienda', '#8b5cf6', 'home', 'expense', 'needs'),
    (NEW.id, 'Salud', '#10b981', 'heart-pulse', 'expense', 'needs'),
    (NEW.id, 'Ocio', '#f59e0b', 'gamepad-2', 'expense', 'wants'),
    (NEW.id, 'Suscripciones', '#6366f1', 'credit-card', 'expense', 'wants'),
    (NEW.id, 'Ropa', '#ec4899', 'shirt', 'expense', 'wants'),
    (NEW.id, 'Educación', '#06b6d4', 'graduation-cap', 'expense', 'needs'),
    (NEW.id, 'Otros', '#6b7280', 'more-horizontal', 'expense', 'wants'),
    (NEW.id, 'Salario', '#22c55e', 'briefcase', 'income', NULL),
    (NEW.id, 'Freelance', '#14b8a6', 'laptop', 'income', NULL),
    (NEW.id, 'Inversiones', '#a855f7', 'trending-up', 'income', NULL),
    (NEW.id, 'Otros', '#6b7280', 'circle-dollar-sign', 'income', NULL);
  RETURN NEW;
END;
$$;
