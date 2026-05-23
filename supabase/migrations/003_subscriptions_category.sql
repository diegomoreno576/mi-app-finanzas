-- Categoría Suscripciones + defaults para nuevos usuarios

INSERT INTO public.categories (user_id, name, color, icon, type)
SELECT u.id, 'Suscripciones', '#6366f1', 'credit-card', 'expense'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = u.id AND c.name = 'Suscripciones' AND c.type = 'expense'
);

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
    (NEW.id, 'Suscripciones', '#6366f1', 'credit-card', 'expense'),
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
