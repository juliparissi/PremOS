export type PremosPlan = "lite" | "full" | "pro";

export type PremosModule =
  | "asistente"
  | "resumen"
  | "reportes"
  | "clientes"
  | "productos"
  | "listas-precios"
  | "presupuestos"
  | "ventas"
  | "pedidos"
  | "produccion"
  | "economia"
  | "nomina"
  | "suministro"
  | "stock"
  | "soporte"
  | "configuracion";

export const planLabels: Record<PremosPlan, string> = {
  lite: "PremOS Lite",
  full: "PremOS Full",
  pro: "PremOS Pro",
};

export const planModules: Record<PremosPlan, PremosModule[]> = {
  lite: [
    "resumen",
    "clientes",
    "productos",
    "presupuestos",
    "ventas",
    "pedidos",
    "economia",
    "soporte",
    "configuracion",
  ],
  full: [
    "resumen",
    "reportes",
    "clientes",
    "productos",
    "listas-precios",
    "presupuestos",
    "ventas",
    "pedidos",
    "produccion",
    "economia",
    "suministro",
    "stock",
    "soporte",
    "configuracion",
  ],
  pro: [
    "asistente",
    "resumen",
    "reportes",
    "clientes",
    "productos",
    "listas-precios",
    "presupuestos",
    "ventas",
    "pedidos",
    "produccion",
    "economia",
    "nomina",
    "suministro",
    "stock",
    "soporte",
    "configuracion",
  ],
};

export const routeModules: Record<string, PremosModule> = {
  "/asistente": "asistente",
  "/resumen": "resumen",
  "/reportes": "reportes",
  "/clientes": "clientes",
  "/productos/lista-precios": "listas-precios",
  "/productos": "productos",
  "/presupuestos": "presupuestos",
  "/ventas": "ventas",
  "/pedidos": "pedidos",
  "/produccion": "produccion",
  "/economia": "economia",
  "/nomina": "nomina",
  "/suministro": "suministro",
  "/stock": "stock",
  "/soporte": "soporte",
  "/configuracion": "configuracion",
};

export function normalizePlan(value: string | null | undefined): PremosPlan {
  if (value === "lite" || value === "full" || value === "pro") {
    return value;
  }

  return "full";
}

export function canUseModule(plan: PremosPlan, module: PremosModule) {
  return planModules[plan].includes(module);
}

export function moduleForPath(pathname: string) {
  const match = Object.entries(routeModules)
    .sort(([a], [b]) => b.length - a.length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`));

  return match?.[1];
}
