"use client";

import { useState } from "react";
import { crearPermiso } from "@/lib/permisos-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTACIONES, TAREAS_DISPONIBLES, TAREAS_PROXIMAMENTE } from "@/lib/content";
import type { TipoPermiso } from "@/types/database";

export function ConfigObraForm({ inspectorName }: { inspectorName: string }) {
  const [tarea, setTarea] = useState<string>("");
  const [tipoPermiso, setTipoPermiso] = useState<TipoPermiso | "">("");
  const [esEspacioConfinado, setEsEspacioConfinado] = useState(false);

  const tareaHabilitada = TAREAS_DISPONIBLES.includes(tarea);
  const listoParaAvanzar = tareaHabilitada && tipoPermiso !== "";
  const requiereGases = tipoPermiso === "Caliente" || esEspacioConfinado;

  return (
    <form action={crearPermiso} className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="obra">Estación / Tramo</Label>
            <Select name="obra" defaultValue={ESTACIONES[0]}>
              <SelectTrigger id="obra" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTACIONES.map((estacion) => (
                  <SelectItem key={estacion} value={estacion}>
                    {estacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Inspector</Label>
            <Input value={inspectorName} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="solicitante_contratista">Solicitante Contratista</Label>
            <Input id="solicitante_contratista" name="solicitante_contratista" placeholder="Ing. Pedro Gómez" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Tarea a realizar</p>
        <Select name="tarea" value={tarea} onValueChange={(value) => setTarea(value ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí una tarea" />
          </SelectTrigger>
          <SelectContent>
            {TAREAS_DISPONIBLES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
            {TAREAS_PROXIMAMENTE.map((t) => (
              <SelectItem key={t} value={t} disabled>
                {t} (próximamente)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tarea === "" ? null : tareaHabilitada ? (
          <p className="text-sm font-medium text-success">Tarea habilitada: {tarea}. Continuá abajo.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta tarea todavía no está disponible en el MVP — por ahora el flujo completo solo está
            desarrollado para Excavación.
          </p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Tipo de permiso</p>
        <RadioGroup
          name="tipo_permiso"
          value={tipoPermiso}
          onValueChange={(value) => setTipoPermiso(value as TipoPermiso)}
          className="flex gap-6"
        >
          <Label htmlFor="tipo-frio" className="flex cursor-pointer items-center gap-2 font-normal">
            <RadioGroupItem value="Frío" id="tipo-frio" />
            Frío
          </Label>
          <Label htmlFor="tipo-caliente" className="flex cursor-pointer items-center gap-2 font-normal">
            <RadioGroupItem value="Caliente" id="tipo-caliente" />
            Caliente
          </Label>
        </RadioGroup>

        <Label htmlFor="es_espacio_confinado" className="flex cursor-pointer items-start gap-2 font-normal">
          <Checkbox
            id="es_espacio_confinado"
            name="es_espacio_confinado"
            checked={esEspacioConfinado}
            onCheckedChange={(checked) => setEsEspacioConfinado(checked === true)}
          />
          <span>
            ¿La tarea clasifica como espacio confinado?
            <span className="block text-sm text-muted-foreground">
              Una excavación puede ser espacio confinado independientemente de si el permiso es frío o
              caliente — si aplica, la medición de gases es obligatoria igual.
            </span>
          </span>
        </Label>

        {tipoPermiso === "" ? (
          <p className="text-sm font-medium text-brand-amber">Seleccioná el tipo de permiso para continuar.</p>
        ) : requiereGases ? (
          <p className="text-sm text-muted-foreground">
            Se exige medición de gases y reverificación cada 60 minutos en Momento 1 (
            {tipoPermiso === "Caliente" ? "trabajo en caliente" : "espacio confinado"}).
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Trabajo en frío sin espacio confinado: la medición de gases no aplica para este permiso.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={!listoParaAvanzar}>
        Siguiente →
      </Button>
    </form>
  );
}
