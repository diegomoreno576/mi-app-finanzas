"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories } from "@/lib/hooks/useCategories";
import { CategoryIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { CategoryForm } from "@/components/dashboard/categories/CategoryForm";
import type { Category, CategoryType } from "@/types";

function CategorySection({
  title,
  type,
  categories,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  type: CategoryType;
  categories: Category[];
  onAdd: (type: CategoryType) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Button size="sm" variant="secondary" onClick={() => onAdd(type)}>
          <Plus className="h-4 w-4" />
          Añadir
        </Button>
      </div>
      {categories.length === 0 ? (
        <EmptyState title={`Sin categorías de ${title.toLowerCase()}`} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <CategoryIcon
                      name={cat.icon}
                      className="h-5 w-5"
                      style={{ color: cat.color }}
                    />
                  </div>
                  <span className="font-medium text-slate-100">{cat.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(cat)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(cat)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoriesView() {
  const {
    loading,
    error,
    getByType,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultType, setDefaultType] = useState<CategoryType>("expense");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate(type: CategoryType) {
    setEditing(null);
    setDefaultType(type);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function requestDelete(cat: Category) {
    setDeleteTarget(cat);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteCategory(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Categorías</h1>
        <p className="text-slate-400">
          Organiza tus ingresos y gastos por categoría
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <CategorySection
        title="Gastos"
        type="expense"
        categories={getByType("expense")}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={requestDelete}
      />

      <CategorySection
        title="Ingresos"
        type="income"
        categories={getByType("income")}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={requestDelete}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar categoría" : "Nueva categoría"}
      >
        <CategoryForm
          initial={editing ?? undefined}
          defaultType={defaultType}
          onCancel={closeModal}
          onSubmit={async (data) => {
            const result = editing
              ? await updateCategory(editing.id, data)
              : await createCategory(data);
            if (!result.error) closeModal();
            return result;
          }}
        />
      </Modal>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar categoría"
        description="Se eliminará la categoría y no podrás usarla en nuevas transacciones."
        itemName={deleteTarget?.name}
        loading={deleting}
      />
    </div>
  );
}
