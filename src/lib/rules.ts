// Reglas de negocio (Hard Gates) como funciones puras — portadas 1:1 desde
// core/rules.py del prototipo Streamlit. La lógica no cambia, solo el lenguaje.
import type { EntibadoAplica, EstadoSertronic, Gases } from "@/types/database";

export function evaluarGases(gases: Gases): { bloqueado: boolean; errores: string[] } {
  const errores: string[] = [];
  if (gases.lel > 0) errores.push(`L.E.L. es ${gases.lel}% (Debe ser 0%).`);
  if (gases.o2 < 19.5 || gases.o2 > 23.5) {
    errores.push(`Oxígeno anormal: ${gases.o2}% (19.5% - 23.5%).`);
  }
  if (gases.co > 25) errores.push(`CO excedido: ${gases.co} ppm (Máx 25 ppm).`);
  if (gases.h2s > 10) errores.push(`H2S tóxico: ${gases.h2s} ppm (Máx 10 ppm).`);
  return { bloqueado: errores.length > 0, errores };
}

export interface ZanjaInput {
  profPlan: number;
  chkVigia: boolean;
  chkEscape: boolean;
  chkNoMadera: boolean;
  entibadoAplica: EntibadoAplica | null;
  chkEntibadoInstalado: boolean;
  chkVallas: boolean;
  chkArnes: boolean;
}

export function evaluarZanja(input: ZanjaInput): { bloqueado: boolean; errores: string[] } {
  if (input.profPlan <= 1.2) return { bloqueado: false, errores: [] };

  const errores: string[] = [];
  if (!(input.chkVigia && input.chkEscape && input.chkNoMadera)) {
    errores.push(
      "Faltan controles obligatorios (> 1.20 m): vigía de retén, doble salida de escape o vallas sin madera.",
    );
  }

  if (input.entibadoAplica === null) {
    errores.push("Definí si el entibado aplica (consultá la tipificación de suelos) antes de continuar.");
  } else if (input.entibadoAplica === "Sí" && !input.chkEntibadoInstalado) {
    errores.push("El entibado aplica según el tipo de suelo y todavía no está instalado.");
  }

  if (input.profPlan > 1.5 && !input.chkVallas) {
    errores.push("Falta vallado perimetral a 1.00 m del borde (obligatorio > 1.50 m).");
  }

  if (input.profPlan > 1.8 && !input.chkArnes) {
    errores.push("Falta arnés de cuerpo completo y cabo de vida (obligatorio > 1.80 m).");
  }

  return { bloqueado: errores.length > 0, errores };
}

export function evaluarSertronic(
  personal: EstadoSertronic,
  vehiculos: EstadoSertronic,
  maquinaria: EstadoSertronic,
): { bloqueado: boolean; detalle: Record<string, EstadoSertronic> } {
  const detalle = { Personal: personal, Vehículos: vehiculos, Maquinaria: maquinaria };
  const bloqueado = Object.values(detalle).some((v) => v === "Rojo");
  return { bloqueado, detalle };
}

export function requiereGases(tipoPermiso: string | null, esEspacioConfinado: boolean): boolean {
  return tipoPermiso === "Caliente" || esEspacioConfinado;
}

export const GAS_RECHECK_INTERVAL_SECONDS = 60 * 60;

export function generarToken(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}
