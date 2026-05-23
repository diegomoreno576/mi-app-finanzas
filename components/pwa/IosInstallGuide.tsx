import { Share } from "lucide-react";

interface IosInstallGuideProps {
  safariOnly?: boolean;
}

export function IosInstallGuide({ safariOnly }: IosInstallGuideProps) {
  return (
    <div className="space-y-4 text-sm text-slate-300">
      {safariOnly ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
          Abre esta página en <strong>Safari</strong> para poder instalar la app.
          Copia la URL y pégala en Safari si hace falta.
        </p>
      ) : null}
      <p>Para instalar en iPhone o iPad:</p>
      <ol className="list-decimal space-y-3 pl-5">
        <li className="pl-1">
          Pulsa el botón <strong>Compartir</strong>{" "}
          <Share className="inline h-4 w-4 align-text-bottom text-violet-400" />{" "}
          en la barra inferior de Safari.
        </li>
        <li className="pl-1">
          Desplázate y elige <strong>Añadir a inicio</strong>.
        </li>
        <li className="pl-1">
          Confirma con <strong>Añadir</strong> arriba a la derecha.
        </li>
      </ol>
      <p className="text-slate-500">
        La app aparecerá en tu pantalla de inicio como cualquier otra.
      </p>
    </div>
  );
}
