"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { eliminarPermiso } from "@/lib/permisos-actions";

export function EliminarPermisoButton({ permisoId }: { permisoId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleEliminar() {
    startTransition(async () => {
      const res = await eliminarPermiso(permisoId);
      if (res.ok) {
        toast.success("Inspección eliminada.");
        setOpen(false);
        router.push("/");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" className="w-full" />}>
        🗑️ Eliminar inspección
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta inspección?</DialogTitle>
          <DialogDescription>
            Se borran también sus evidencias, interferencias y tokens. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={handleEliminar} disabled={pending}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
