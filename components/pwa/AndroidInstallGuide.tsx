export function AndroidInstallGuide() {
  return (
    <div className="space-y-3 text-sm text-slate-300">
      <p>Para instalar en Android:</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li className="pl-1">
          Abre el menú del navegador <strong>⋮</strong> (tres puntos).
        </li>
        <li className="pl-1">
          Elige <strong>Instalar aplicación</strong> o{" "}
          <strong>Añadir a pantalla de inicio</strong>.
        </li>
      </ol>
      <p className="text-slate-500">
        Si no aparece la opción, prueba con Chrome y visita la app en HTTPS.
      </p>
    </div>
  );
}
