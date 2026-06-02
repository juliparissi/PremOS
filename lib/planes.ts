export type PremosPlan = "lite" | "full";

export type PremosModule =
  | "asistente"
  | "resumen"
  | "reportes"
  | "clientes"
  | "productos"
  | "presupuestos"
  | "ventas"
  | "pedidos"
  | "produccion"
  | "economia"
  | "suministro"
  | "stock"
  | "configuracion";

export const planLabels: Record<PremosPlan, string> = {
  lite: "PremOS Lite",
  full: "PremOS Full",
};

export const planModules: Record<PremosPlan, PremosModule[]> = {
  lite: [
    "resumen",
    "reportes",
    "clientes",
    "productos",
    "presupuestos",
    "ventas",
    "pedidos",
    "configuracion",
  ],
  full: [
    "asistente",
    "resumen",
    "reportes",
    "clientes",
    "productos",
    "presupuestos",
    "ventas",
    "pedidos",
    "produccion",
    "economia",
    "suministro",
    "stock",
    "configuracion",
  ],
};

export const routeModules: Record<string, PremosModule> = {
  "/asistente": "asistente",
  "/resumen": "resumen",
  "/reportes": "reportes",
  "/clientes": "clientes",
  "/productos": "productos",
  "/presupuestos": "presupuestos",
  "/ventas": "ventas",
  "/pedidos": "pedidos",
  "/produccion": "produccion",
  "/economia": "economia",
  "/suministro": "suministro",
  "/stock": "stock",
  "/configuracion": "configuracion",
};

export function normalizePlan(value: string | null | undefined): PremosPlan {
  return value === "lite" ? "lite" : "full";
}

export function canUseModule(plan: PremosPlan, module: PremosModule) {
  return planModules[plan].includes(module);
}

export function moduleForPath(pathname: string) {
  const match = Object.entries(routeModules).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  return match?.[1];
}
