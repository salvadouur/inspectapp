"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GasCountdown } from "@/components/gas-countdown";
import { SertronicToggle } from "@/components/sertronic-toggle";
import { EvidenceUploader, type EvidenciaInicial } from "@/components/evidence-uploader";
import { evaluarGases, evaluarSertronic, requiereGases, GAS_RECHECK_INTERVAL_SECONDS } from "@/lib/rules";
import { registrarVerificacionGases, enviarMomento1 } from "@/lib/momento1-actions";
import { createClient } from "@/lib/supabase/client";
import type { EstadoSertronic, Gases, TipoEvidencia, TipoPermiso } from "@/types/database";

interface PermisoMomento1 {
  id: string;
  tipo_permiso: TipoPermiso | null;
  es_espacio_confinado: boolean;
  num_permiso: string;
  num_cpt: string;
  sertronic_personal: EstadoSertronic;
  sertronic_vehiculos: EstadoSertronic;
  sertronic_maquinaria: EstadoSertronic;
  gases: Gases;
  gases_ultima_verificacion: string | null;
  cpt_checked: boolean;
  firma_inspector_m1: boolean;
  m1_enviado_at: string | null;
  m1_habilitado_por_referente_at: string | null;
}

const EVIDENCIAS: Array<{ tipo: TipoEvidencia; label: string }> = [
  { tipo: "charla", label: "Charla de 5 minutos" },
  { tipo: "cpt", label: "Planilla CPT firmada" },
  { tipo: "permiso_frente", label: "Permiso de Trabajo — Frente" },
  { tipo: "permiso_dorso", label: "Permiso de Trabajo — Dorso" },
];

export function Momento1Form({
  permiso,
  evidenciasIniciales,
}: {
  permiso: PermisoMomento1;
  evidenciasIniciales: Record<TipoEvidencia, EvidenciaInicial | null>;
}) {
  const [numPermiso, setNumPermiso] = useState(permiso.num_permiso);
  const [numCpt, setNumCpt] = useState(permiso.num_cpt);
  const [sertronicPersonal, setSertronicPersonal] = useState(permiso.sertronic_personal);
  const [sertronicVehiculos, setSertronicVehiculos] = useState(permiso.sertronic_vehiculos);
  const [sertronicMaquinaria, setSertronicMaquinaria] = useState(permiso.sertronic_maquinaria);
  const [gases, setGases] = useState<Gases>(permiso.gases);
  const [gasesUltimaVerificacion, setGasesUltimaVerificacion] = useState(permiso.gases_ultima_verificacion);
  const [cptChecked, setCptChecked] = useState(permiso.cpt_checked);
  const [firmaChecked, setFirmaChecked] = useState(permiso.firma_inspector_m1);
  const [evidenciasOk, setEvidenciasOk] = useState<Record<TipoEvidencia, boolean>>({
    charla: !!evidenciasIniciales.charla,
    cpt: !!evidenciasIniciales.cpt,
    permiso_frente: !!evidenciasIniciales.permiso_frente,
    permiso_dorso: !!evidenciasIniciales.permiso_dorso,
  });
  const [enviado, setEnviado] = useState(!!permiso.m1_enviado_at);
  const [habilitado, setHabilitado] = useState(!!permiso.m1_habilitado_por_referente_at);

  const [pendingGases, startGasesTransition] = useTransition();
  const [pendingEnviar, startEnviarTransition] = useTransition();

  // Realtime: si el Referente habilita el Momento 2 desde otro dispositivo, esta
  // pantalla se desbloquea sola sin que el Inspector tenga que recargar.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`permiso-${permiso.id}-momento1`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "permisos", filter: `id=eq.${permiso.id}` },
        (payload) => {
          const nuevo = payload.new as { m1_habilitado_por_referente_at: string | null };
          if (nuevo.m1_habilitado_por_referente_at) {
            setHabilitado(true);
            toast.success("El Referente habilitó el paso a Momento 2.");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permiso.id]);

  const requiereGasesFlag = requiereGases(permiso.tipo_permiso, permiso.es_espacio_confinado);
  const { bloqueado: bloqueoSertronic, detalle: detalleSertronic } = evaluarSertronic(
    sertronicPersonal,
    sertronicVehiculos,
    sertronicMaquinaria,
  );
  const { bloqueado: bloqueoGases, errores: erroresGases } = evaluarGases(gases);
  const gasesNoVerificados = requiereGasesFlag && !gasesUltimaVerificacion;
  const evidenciasCompletas = Object.values(evidenciasOk).every(Boolean);
  const firmaHabilitada =
    !bloqueoSertronic && !bloqueoGases && !gasesNoVerificados && cptChecked && evidenciasCompletas;
  const m1Listo = firmaChecked && firmaHabilitada;

  function handleGasChange(campo: keyof Gases, valor: number) {
    setGases((g) => ({ ...g, [campo]: valor }));
  }

  function handleRegistrarGases() {
    startGasesTransition(async () => {
      const res = await registrarVerificacionGases(permiso.id, gases);
      if (res.ok) {
        setGasesUltimaVerificacion(new Date().toISOString());
        toast.success("Verificación de gases registrada.");
      } else {
        toast.error("No se pudo registrar la verificación de gases.");
      }
    });
  }

  function handleEnviar() {
    startEnviarTransition(async () => {
      const res = await enviarMomento1(permiso.id, {
        numPermiso,
        numCpt,
        sertronicPersonal,
        sertronicVehiculos,
        sertronicMaquinaria,
        gases,
        gasesUltimaVerificacion,
        tipoPermiso: permiso.tipo_permiso,
        esEspacioConfinado: permiso.es_espacio_confinado,
        cptChecked,
        evidenciasCompletas,
      });
      if (res.ok) {
        setEnviado(true);
        toast.success("Momento 1 enviado al Referente.");
      } else {
        toast.error(res.error);
      }
    });
  }

  const faltantes: string[] = [];
  if (bloqueoSertronic) faltantes.push("regularizar habilitaciones en Sertronic");
  if (bloqueoGases) faltantes.push("resolver el bloqueo de gases");
  if (gasesNoVerificados) faltantes.push("registrar la verificación de gases");
  if (!evidenciasCompletas) faltantes.push("adjuntar las 4 evidencias fotográficas");
  if (!cptChecked) faltantes.push("certificar la charla/CPT");
  if (!firmaChecked && firmaHabilitada) faltantes.push("firmar el Momento 1");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <p className="font-medium">Verificación Documental</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="num_permiso">N° Permiso (Sertronic)</Label>
            <Input id="num_permiso" value={numPermiso} onChange={(e) => setNumPermiso(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="num_cpt">N° CPT Asociado (Blister)</Label>
            <Input id="num_cpt" value={numCpt} onChange={(e) => setNumCpt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium">Consulta Automatizada de Habilitaciones (Sertronic)</p>
            <p className="text-xs text-muted-foreground">
              Simulación binaria por recurso, previa a la conexión técnica definitiva con la API de Sertronic.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SertronicToggle label="Personal" value={sertronicPersonal} onChange={setSertronicPersonal} />
            <SertronicToggle label="Vehículos" value={sertronicVehiculos} onChange={setSertronicVehiculos} />
            <SertronicToggle label="Maquinaria" value={sertronicMaquinaria} onChange={setSertronicMaquinaria} />
          </div>
          {bloqueoSertronic ? (
            <Alert variant="destructive">
              <AlertDescription>
                🛑 BLOQUEO DE SEGURIDAD (HARD GATE) — Documentación vencida o faltante en:{" "}
                {Object.entries(detalleSertronic)
                  .filter(([, v]) => v === "Rojo")
                  .map(([k]) => k)
                  .join(", ")}
                . Andá a Sertronic y solicitá la regularización a la contratista.
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm font-medium text-success">
              Habilitaciones vigentes. Personal, vehículos y maquinaria en regla.
            </p>
          )}
        </div>
      </div>

      {requiereGasesFlag ? (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="font-medium">Control Crítico de Gases</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gas_lel">L.E.L (%)</Label>
              <Input
                id="gas_lel"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={gases.lel}
                onChange={(e) => handleGasChange("lel", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gas_o2">O2 (%)</Label>
              <Input
                id="gas_o2"
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={gases.o2}
                onChange={(e) => handleGasChange("o2", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gas_co">CO (ppm)</Label>
              <Input
                id="gas_co"
                type="number"
                step="1"
                min={0}
                max={1000}
                value={gases.co}
                onChange={(e) => handleGasChange("co", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gas_h2s">H2S (ppm)</Label>
              <Input
                id="gas_h2s"
                type="number"
                step="1"
                min={0}
                max={500}
                value={gases.h2s}
                onChange={(e) => handleGasChange("h2s", Number(e.target.value))}
              />
            </div>
          </div>

          {bloqueoGases ? (
            <Alert variant="destructive">
              <AlertDescription>
                🛑 BLOQUEO DE SEGURIDAD (HARD GATE)
                <br />
                {erroresGases.join(" ")}
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm font-medium text-success">Atmósfera segura. Valores dentro del rango tolerado.</p>
          )}

          {gasesUltimaVerificacion ? (
            <GasCountdown
              targetMs={new Date(gasesUltimaVerificacion).getTime() + GAS_RECHECK_INTERVAL_SECONDS * 1000}
            />
          ) : (
            <p className="text-sm font-medium text-brand-amber">
              Todavía no registraste la verificación de gases — es obligatoria para completar Momento 1.
            </p>
          )}

          <Button type="button" onClick={handleRegistrarGases} disabled={pendingGases}>
            ✅ Registrar verificación de gases
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Trabajo en frío sin espacio confinado: la medición de gases no aplica para este permiso.
        </p>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <p className="font-medium">Firmas y Evidencia (Momento 1)</p>
        <Label htmlFor="cpt_checked" className="flex cursor-pointer items-start gap-2 font-normal">
          <Checkbox
            id="cpt_checked"
            checked={cptChecked}
            onCheckedChange={(checked) => setCptChecked(checked === true)}
          />
          <span>
            Certifico bajo declaración jurada haber brindado la charla de 5 minutos y verificado el CPT en
            físico.
          </span>
        </Label>

        <div className="grid gap-4 sm:grid-cols-2">
          {EVIDENCIAS.map(({ tipo, label }) => (
            <EvidenceUploader
              key={tipo}
              permisoId={permiso.id}
              tipo={tipo}
              label={label}
              initial={evidenciasIniciales[tipo]}
              onChange={(completo) => setEvidenciasOk((s) => ({ ...s, [tipo]: completo }))}
            />
          ))}
        </div>

        <Label
          htmlFor="firma_inspector"
          className="flex cursor-pointer items-start gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-50"
        >
          <Checkbox
            id="firma_inspector"
            checked={firmaChecked}
            disabled={!firmaHabilitada}
            onCheckedChange={(checked) => setFirmaChecked(checked === true)}
          />
          <span>Firma: Inspector (Momento 1)</span>
        </Label>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        {!m1Listo ? (
          <Alert>
            <AlertDescription>
              Faltan pasos para completar Momento 1: {faltantes.join("; ")}.
            </AlertDescription>
          </Alert>
        ) : !enviado ? (
          <>
            <p className="text-sm font-medium text-success">
              Momento 1 completo. Enviá la notificación al Referente para poder pasar a Momento 2.
            </p>
            <Button type="button" onClick={handleEnviar} disabled={pendingEnviar} className="w-full">
              📤 Enviar Momento 1 al Referente
            </Button>
          </>
        ) : !habilitado ? (
          <p className="text-sm text-muted-foreground">
            Momento 1 enviado. Esperando que el Referente habilite el paso a Momento 2.
          </p>
        ) : (
          <p className="text-sm font-medium text-success">✅ Momento 2 habilitado por el Referente.</p>
        )}
      </div>

      {habilitado ? (
        <Button type="button" size="lg" className="w-full" render={<Link href={`/permisos/${permiso.id}/momento2`} />}>
          Siguiente →
        </Button>
      ) : (
        <Button type="button" size="lg" className="w-full" disabled>
          Siguiente →
        </Button>
      )}
    </div>
  );
}
