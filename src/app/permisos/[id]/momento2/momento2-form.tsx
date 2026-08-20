"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TIPIFICACION_SUELOS_URL } from "@/lib/content";
import { evaluarZanja } from "@/lib/rules";
import {
  agregarInterferencia,
  quitarInterferencia,
  solicitarTokenOmision,
  validarTokenOmision,
  generarReporteLiberacion,
} from "@/lib/momento2-actions";
import { createClient } from "@/lib/supabase/client";
import type { EntibadoAplica, EstadoPermiso } from "@/types/database";

interface Interferencia {
  id: string;
  tipo: string;
  profundidad: number;
}

interface PermisoMomento2 {
  id: string;
  eq_nombre_deteccion: string;
  eq_calibracion_vigente: boolean;
  eq_acopio: boolean;
  eq_clima: boolean;
  cateo_360: boolean;
  eq_delimitacion: boolean;
  prof_plan: number;
  entibado_aplica: EntibadoAplica | null;
  chk_vigia: boolean;
  chk_escape: boolean;
  chk_no_madera: boolean;
  chk_entibado_instalado: boolean;
  chk_vallas: boolean;
  chk_arnes: boolean;
  maquinaria_paralela: boolean;
  omision_stop_mecanico_autorizada: boolean;
  status: EstadoPermiso;
}

export function Momento2Form({
  permiso,
  interferenciasIniciales,
}: {
  permiso: PermisoMomento2;
  interferenciasIniciales: Interferencia[];
}) {
  const [eqNombreDeteccion, setEqNombreDeteccion] = useState(permiso.eq_nombre_deteccion);
  const [eqCalibracionVigente, setEqCalibracionVigente] = useState(permiso.eq_calibracion_vigente);
  const [cateo360, setCateo360] = useState(permiso.cateo_360);
  const [eqAcopio, setEqAcopio] = useState(permiso.eq_acopio);
  const [eqClima, setEqClima] = useState(permiso.eq_clima);
  const [eqDelimitacion, setEqDelimitacion] = useState(permiso.eq_delimitacion);

  const [interferencias, setInterferencias] = useState<Interferencia[]>(interferenciasIniciales);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevaProf, setNuevaProf] = useState(0);

  const [profPlan, setProfPlan] = useState(permiso.prof_plan);
  const [chkVigia, setChkVigia] = useState(permiso.chk_vigia);
  const [chkEscape, setChkEscape] = useState(permiso.chk_escape);
  const [chkNoMadera, setChkNoMadera] = useState(permiso.chk_no_madera);
  const [entibadoAplica, setEntibadoAplica] = useState<EntibadoAplica | "">(permiso.entibado_aplica ?? "");
  const [chkEntibadoInstalado, setChkEntibadoInstalado] = useState(permiso.chk_entibado_instalado);
  const [chkVallas, setChkVallas] = useState(permiso.chk_vallas);
  const [chkArnes, setChkArnes] = useState(permiso.chk_arnes);

  const [maquinariaParalela, setMaquinariaParalela] = useState(permiso.maquinaria_paralela);
  const [excavacionProxima, setExcavacionProxima] = useState<"no" | "si">("no");
  const [omisionAutorizada, setOmisionAutorizada] = useState(permiso.omision_stop_mecanico_autorizada);
  const [tokenInput, setTokenInput] = useState("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [autorizado, setAutorizado] = useState(permiso.status === "autorizado");

  const [pendingInterf, startInterfTransition] = useTransition();
  const [pendingToken, startTokenTransition] = useTransition();
  const [pendingSolicitud, startSolicitudTransition] = useTransition();
  const [pendingReporte, startReporteTransition] = useTransition();

  // Realtime: si el Referente genera un token de Omisión Autorizada desde su Panel,
  // avisamos al Inspector para que sepa que ya lo puede pedir por teléfono.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`permiso-${permiso.id}-tokens`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tokens_omision", filter: `permiso_id=eq.${permiso.id}` },
        () => {
          toast.info("El Referente generó un nuevo token de Omisión Autorizada.");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permiso.id]);

  const profundidadCritica = profPlan > 1.2;

  const { bloqueado: bloqueoFosa, errores: erroresFosa } = evaluarZanja({
    profPlan,
    chkVigia: profundidadCritica ? chkVigia : false,
    chkEscape: profundidadCritica ? chkEscape : false,
    chkNoMadera: profundidadCritica ? chkNoMadera : false,
    entibadoAplica: profundidadCritica ? (entibadoAplica || null) : null,
    chkEntibadoInstalado: profundidadCritica ? chkEntibadoInstalado : false,
    chkVallas: profundidadCritica ? chkVallas : false,
    chkArnes: profundidadCritica ? chkArnes : false,
  });

  const omisionOk = excavacionProxima === "no" || omisionAutorizada;
  const bloqueoMaq = excavacionProxima === "si" && !omisionAutorizada;

  const m2Listo =
    eqCalibracionVigente &&
    eqDelimitacion &&
    cateo360 &&
    eqAcopio &&
    eqClima &&
    maquinariaParalela &&
    !bloqueoFosa &&
    !bloqueoMaq;

  function handleAgregarInterferencia() {
    if (!nuevoTipo.trim()) return;
    startInterfTransition(async () => {
      const res = await agregarInterferencia(permiso.id, nuevoTipo.trim(), nuevaProf);
      if (res.ok) {
        setInterferencias((list) => [...list, res.interferencia]);
        setNuevoTipo("");
        setNuevaProf(0);
      } else {
        toast.error("No se pudo agregar la interferencia.");
      }
    });
  }

  function handleQuitarInterferencia(id: string) {
    startInterfTransition(async () => {
      const res = await quitarInterferencia(id, permiso.id);
      if (res.ok) {
        setInterferencias((list) => list.filter((i) => i.id !== id));
      } else {
        toast.error("No se pudo quitar la interferencia.");
      }
    });
  }

  function handleSolicitarToken() {
    startSolicitudTransition(async () => {
      const res = await solicitarTokenOmision(permiso.id);
      if (res.ok) {
        setSolicitudEnviada(true);
        toast.success("Se avisó al Referente. Esperá que te dicte el token por teléfono.");
      } else {
        toast.error("No se pudo avisar al Referente.");
      }
    });
  }

  function handleValidarToken() {
    startTokenTransition(async () => {
      const res = await validarTokenOmision(permiso.id, tokenInput.trim());
      if (res.ok) {
        setOmisionAutorizada(true);
        toast.success("Omisión Autorizada validada.");
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleGenerarReporte() {
    startReporteTransition(async () => {
      const res = await generarReporteLiberacion(permiso.id, {
        eqNombreDeteccion,
        eqCalibracionVigente,
        cateo360,
        eqAcopio,
        eqClima,
        eqDelimitacion,
        profPlan,
        entibadoAplica: profundidadCritica ? (entibadoAplica || null) : null,
        chkVigia,
        chkEscape,
        chkNoMadera,
        chkEntibadoInstalado,
        chkVallas,
        chkArnes,
        maquinariaParalela,
        omisionValidadaOrNoRequerida: omisionOk,
      });
      if (res.ok) {
        setAutorizado(true);
        toast.success("Reporte de liberación generado y notificado al Referente.");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-4">
        <p className="font-medium">Equipamiento e Interferencias</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Label className="flex cursor-pointer items-center gap-2 font-normal">
              <Checkbox checked={eqCalibracionVigente} onCheckedChange={(c) => setEqCalibracionVigente(c === true)} />
              Equipo de detección con calibración vigente
            </Label>
            <div className="space-y-2">
              <Label htmlFor="eq_nombre">Nombre / modelo del equipo (RD, Georadar, etc.)</Label>
              <Input id="eq_nombre" value={eqNombreDeteccion} onChange={(e) => setEqNombreDeteccion(e.target.value)} />
            </div>
            <Label className="flex cursor-pointer items-center gap-2 font-normal">
              <Checkbox checked={cateo360} onCheckedChange={(c) => setCateo360(c === true)} />
              Cateo manual a 360° realizado
            </Label>
          </div>
          <div className="space-y-3">
            <Label className="flex cursor-pointer items-center gap-2 font-normal">
              <Checkbox checked={eqAcopio} onCheckedChange={(c) => setEqAcopio(c === true)} />
              Acopio de material a &gt; 2.00 m del borde
            </Label>
            <Label className="flex cursor-pointer items-center gap-2 font-normal">
              <Checkbox checked={eqClima} onCheckedChange={(c) => setEqClima(c === true)} />
              Estabilidad del suelo verificada (sin lluvias)
            </Label>
            <Label className="flex cursor-pointer items-center gap-2 font-normal">
              <Checkbox checked={eqDelimitacion} onCheckedChange={(c) => setEqDelimitacion(c === true)} />
              Estacas / demarcación según necesidad
            </Label>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <p className="font-medium">Interferencias identificadas</p>
          {interferencias.map((interf) => (
            <div key={interf.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>🔧 {interf.tipo}</span>
              <span className="text-muted-foreground">Profundidad real: {interf.profundidad.toFixed(2)} m</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendingInterf}
                onClick={() => handleQuitarInterferencia(interf.id)}
              >
                Quitar
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-40 space-y-1">
              <Label htmlFor="nuevo_tipo" className="text-xs">
                Tipo de interferencia detectada
              </Label>
              <Input id="nuevo_tipo" value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} />
            </div>
            <div className="w-36 space-y-1">
              <Label htmlFor="nueva_prof" className="text-xs">
                Profundidad real (m)
              </Label>
              <Input
                id="nueva_prof"
                type="number"
                step="0.01"
                min={0}
                value={nuevaProf}
                onChange={(e) => setNuevaProf(Number(e.target.value))}
              />
            </div>
            <Button type="button" disabled={pendingInterf} onClick={handleAgregarInterferencia}>
              ➕ Agregar
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Zanja / Excavación</p>
        <div className="space-y-2">
          <Label htmlFor="prof_plan">Profundidad de excavación planificada (m)</Label>
          <Input
            id="prof_plan"
            type="number"
            step="0.1"
            min={0}
            value={profPlan}
            onChange={(e) => setProfPlan(Number(e.target.value))}
          />
        </div>

        {profundidadCritica ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-brand-amber">
              ⚠️ PROFUNDIDAD CRÍTICA (&gt; 1.20 m). Controles obligatorios:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox checked={chkVigia} onCheckedChange={(c) => setChkVigia(c === true)} />
                Vigía de Retén en exterior
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox checked={chkEscape} onCheckedChange={(c) => setChkEscape(c === true)} />
                Doble Salida de Escape (&lt; 8 m)
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox checked={chkNoMadera} onCheckedChange={(c) => setChkNoMadera(c === true)} />
                Vallas perimetrales sin madera
              </Label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Entibado</p>
              <div className="flex items-center gap-4">
                <RadioGroup
                  value={entibadoAplica}
                  onValueChange={(v) => setEntibadoAplica((v as EntibadoAplica) ?? "")}
                  className="flex gap-4"
                >
                  <Label className="flex cursor-pointer items-center gap-2 font-normal">
                    <RadioGroupItem value="Sí" /> Sí
                  </Label>
                  <Label className="flex cursor-pointer items-center gap-2 font-normal">
                    <RadioGroupItem value="No" /> No
                  </Label>
                </RadioGroup>
                <a
                  href={TIPIFICACION_SUELOS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                >
                  Consultar Tipificación de Suelos
                </a>
              </div>
              {entibadoAplica === "Sí" && (
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox checked={chkEntibadoInstalado} onCheckedChange={(c) => setChkEntibadoInstalado(c === true)} />
                  Entibado instalado
                </Label>
              )}
            </div>

            {profPlan > 1.5 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-brand-amber">🚧 VALLADO OBLIGATORIO (&gt; 1.50 m).</p>
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox checked={chkVallas} onCheckedChange={(c) => setChkVallas(c === true)} />
                  Vallas a mínimo 1.00 m del borde
                </Label>
              </div>
            )}

            {profPlan > 1.8 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">🚨 MÁXIMO RIESGO (&gt; 1.80 m).</p>
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox checked={chkArnes} onCheckedChange={(c) => setChkArnes(c === true)} />
                  Uso de arnés y cabo de vida certificado
                </Label>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-success">Profundidad estándar (&lt; 1.20 m).</p>
        )}

        {bloqueoFosa && (
          <Alert variant="destructive">
            <AlertDescription>
              🛑 BLOQUEO DE FOSA
              <br />
              {erroresFosa.join(" ")}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="font-medium">Posicionamiento de Maquinaria</p>
        <Label className="flex cursor-pointer items-center gap-2 font-normal">
          <Checkbox checked={maquinariaParalela} onCheckedChange={(c) => setMaquinariaParalela(c === true)} />
          Retroexcavadora paralela al ducto
        </Label>

        <RadioGroup
          value={excavacionProxima}
          onValueChange={(v) => setExcavacionProxima((v as "no" | "si") ?? "no")}
          className="gap-2"
        >
          <Label className="flex cursor-pointer items-center gap-2 font-normal">
            <RadioGroupItem value="no" /> No (Stop Mecánico)
          </Label>
          <Label className="flex cursor-pointer items-center gap-2 font-normal">
            <RadioGroupItem value="si" /> Sí (requiere Omisión Autorizada)
          </Label>
        </RadioGroup>

        {excavacionProxima === "si" && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertDescription>🚨 DESVÍO CRÍTICO: vulneración del Stop Mecánico.</AlertDescription>
            </Alert>
            {omisionAutorizada ? (
              <p className="text-sm font-medium text-success">🔓 Omisión Autorizada validada. Podés continuar.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Pedile al Referente que te genere un token de autorización desde su Panel — te va a dictar un
                  código de 4 dígitos.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pendingSolicitud || solicitudEnviada}
                  onClick={handleSolicitarToken}
                >
                  🔔 {solicitudEnviada ? "Solicitud enviada" : "Solicitar token al Referente"}
                </Button>
                <div className="flex gap-2">
                  <Input
                    placeholder="Token de Omisión Autorizada"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    maxLength={4}
                  />
                  <Button type="button" disabled={pendingToken || !tokenInput.trim()} onClick={handleValidarToken}>
                    Validar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        {autorizado ? (
          <p className="text-sm font-medium text-success">🚀 ¡EXCAVACIÓN AUTORIZADA! Reporte generado.</p>
        ) : m2Listo ? (
          <>
            <p className="text-sm font-medium text-success">🚀 ¡EXCAVACIÓN AUTORIZADA!</p>
            <Button type="button" className="w-full" disabled={pendingReporte} onClick={handleGenerarReporte}>
              📥 Generar Reporte de Liberación
            </Button>
          </>
        ) : (
          <p className="text-sm font-medium text-brand-amber">⚠️ Resolvé los bloqueos para habilitar la excavación.</p>
        )}
      </div>
    </div>
  );
}
