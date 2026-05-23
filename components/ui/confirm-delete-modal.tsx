"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  loading?: boolean;
  confirmLabel?: string;
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "¿Eliminar?",
  description = "Esta acción no se puede deshacer.",
  itemName,
  loading = false,
  confirmLabel = "Eliminar",
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{description}</p>
          {itemName ? (
            <p className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-200">
              {itemName}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void onConfirm()}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
