-- Categoría Suministros (luz, agua, gas…) como necesidad 50%

INSERT INTO public.categories (user_id, name, color, icon, type, bucket)
SELECT u.id, 'Suministros', '#eab308', 'zap', 'expense', 'needs'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = u.id AND c.name = 'Suministros' AND c.type = 'expense'
);

-- Por si ya existía sin bucket o como wants
UPDATE public.categories
SET bucket = 'needs'
WHERE type = 'expense'
  AND name IN (
    'Suministros',
    'Luz',
    'Agua',
    'Gas',
    'Comida',
    'Alquiler',
    'Hipoteca'
  );

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
    (NEW.id, 'Suministros', '#eab308', 'zap', 'expense', 'needs'),
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
