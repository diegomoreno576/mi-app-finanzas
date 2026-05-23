export function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (lower.includes("user already registered")) {
    return "Este email ya está registrado.";
  }
  if (lower.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (lower.includes("unable to validate email")) {
    return "Email no válido.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirma tu email antes de iniciar sesión.";
  }
  if (lower.includes("signup requires a valid password")) {
    return "Introduce una contraseña válida.";
  }

  return "Ha ocurrido un error. Inténtalo de nuevo.";
}
