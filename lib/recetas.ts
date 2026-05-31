/*
  RECETAS DE PRODUCCIÓN DURAMAX

  Consumo por cada pastón completo.

  Unidades:

  Cemento -> Bolsas
  Arena -> Kg
  Piedra -> Kg
  Ferrite -> Gramos

  IMPORTANTE:
  Modificar únicamente si cambia
  la fórmula real de producción.
*/

export const RECETAS = {

  Natural: {
    cemento_bolsas: 2,
    arena_kg: 176,
    piedra_kg: 90.4,
  },

  Negro: {
    cemento_bolsas: 2,
    arena_kg: 176,
    piedra_kg: 90.4,

    ferrite: {
      nombre: "Ferrite Negro",
      gramos: 150,
    },
  },

  Rojo: {
    cemento_bolsas: 2,
    arena_kg: 176,
    piedra_kg: 90.4,

    ferrite: {
      nombre: "Ferrite Rojo",
      gramos: 150,
    },
  },

  Terracota: {
    cemento_bolsas: 2,
    arena_kg: 176,
    piedra_kg: 90.4,

    ferrite: {
      nombre: "Ferrite Terracota",
      gramos: 150,
    },
  },

  "Gris Vulcano": {
    cemento_bolsas: 2,
    arena_kg: 176,
    piedra_kg: 90.4,

    ferrite: {
      nombre: "Ferrite Gris Vulcano",
      gramos: 150,
    },
  },

} as const;