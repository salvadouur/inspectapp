// Contenido normativo de referencia (cliente: Oldelval), portado desde core/content.py.
// Se mantiene el contenido tal cual — este módulo es el lugar natural para, en el
// futuro, intercambiar el contenido por el de otro cliente sin tocar la lógica de pantallas.

export const LER_EXCAVACION = [
  "Verificación de traza y cotas para evitar interferencias con caños y cañerías eléctricas enterradas.",
  "Utilización de equipamiento específico de detección (detectores de metales, flujo, georadar) ante interferencias no ubicadas.",
  "Establecimiento de cateo manual de líneas subterráneas a 360° y señalización posterior.",
  "Provisión de chalecos reflectantes y banderillas de peligro para trabajadores expuestos a tráfico vehicular.",
  "Acopio de material: como mínimo a 2.00 metros del borde de la excavación.",
  "Análisis previo del tipo de suelo para definir las medidas de protección necesarias.",
  "Inspección diaria obligatoria de excavaciones, fosas y áreas adyacentes por un supervisor experimentado.",
  "Repetición obligatoria de la inspección en caso de lluvias, filtraciones, nevadas u otras circunstancias que alteren la estabilidad.",
  "Señalización del perímetro a mínimo 1.00 metro del borde, con vallas obligatorias si la profundidad supera 1.50 metros.",
  "Escaleras, rampas u otro medio de salida seguro cuando la profundidad exceda 1.20 metros (traslado máximo 8.00 metros).",
  "Señalización de advertencia para excavaciones abiertas o sin vigilancia fuera del horario de trabajo.",
  "Carteles reflectantes de advertencia según necesidad de la zona de trabajo, más vallado y balizas nocturnas.",
  "Medición de atmósfera explosiva e identificación de gases tóxicos/oxígeno según procedimiento de Espacios Confinados.",
  "Verificación de que no se trabaje con agua acumulada o en aumento sin precauciones de seguridad.",
  "Inspección de los equipos de remoción de agua y operaciones de desagote por supervisor especializado.",
];

export const TIPIFICACION_SUELOS_URL =
  "https://isotools.oldelval.local/procedimientos/tipificacion-de-suelos";

export const COLORES_ESTACADO: Array<[string, string]> = [
  ["Negro / Amarillo", "Línea a intervenir con máquina."],
  ["Rojo / Blanco", "Cruce de interferencia (excavación mecánica bloqueada a menos de 1.00 metro)."],
  ["Blanco absoluto", "Línea paralela de referencia — nunca se excava."],
];

export const TAREAS_DISPONIBLES = ["Excavación"];
export const TAREAS_PROXIMAMENTE = ["Izaje", "Trabajos en Altura", "Soldadura"];

export const ESTACIONES = ["Medanito", "Allen", "Crucero Catriel", "Puerto Rosales"];
