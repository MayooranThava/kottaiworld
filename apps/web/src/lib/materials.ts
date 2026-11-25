/**
 * Core Ashenfall resource icons extracted from RuneScape: Dragonwilds
 * UI textures (T_Icon_*), hosted via Dragonwilds DB for local bundling.
 * Icons © Jagex — see docs/ICON_ATTRIBUTION.md
 */
export type MaterialIcon = {
  id: string;
  name: string;
  src: string;
  href: string;
  blurb: string;
};

export const CORE_MATERIALS: MaterialIcon[] = [
  {
    id: "ash-logs",
    name: "Ash Logs",
    src: "/icons/materials/ash-logs.webp",
    href: "https://www.dragonwildsdatabase.com/items/ash-logs/",
    blurb: "Starter timber · Bramblemead & Temple Woods",
  },
  {
    id: "oak-logs",
    name: "Oak Logs",
    src: "/icons/materials/oak-logs.webp",
    href: "https://www.dragonwildsdatabase.com/items/oak-logs/",
    blurb: "Sturdy wood for planks & furniture",
  },
  {
    id: "stone",
    name: "Stone",
    src: "/icons/materials/stone.webp",
    href: "https://www.dragonwildsdatabase.com/items/stone/",
    blurb: "Basic building & crafting stone",
  },
  {
    id: "granite",
    name: "Granite",
    src: "/icons/materials/granite.webp",
    href: "https://www.dragonwildsdatabase.com/items/granite/",
    blurb: "Dense construction stone",
  },
  {
    id: "copper-ore",
    name: "Copper Ore",
    src: "/icons/materials/copper-ore.webp",
    href: "https://www.dragonwildsdatabase.com/items/copper-ore/",
    blurb: "Smelts to bronze at a furnace",
  },
  {
    id: "iron-ore",
    name: "Iron Ore",
    src: "/icons/materials/iron-ore.webp",
    href: "https://www.dragonwildsdatabase.com/items/iron-ore/",
    blurb: "Mid-tier metal for tools & fittings",
  },
  {
    id: "clay",
    name: "Clay",
    src: "/icons/materials/clay.webp",
    href: "https://www.dragonwildsdatabase.com/items/clay/",
    blurb: "Pottery, moulds, and kiln work",
  },
  {
    id: "rune-essence",
    name: "Rune Essence",
    src: "/icons/materials/rune-essence.webp",
    href: "https://www.dragonwildsdatabase.com/items/rune-essence/",
    blurb: "Mined at geysers · altar crafting",
  },
];

/** Pair construction metrics with a material emblem for the ledger. */
export const LEDGER_EMBLEMS = {
  pieces: CORE_MATERIALS.find((m) => m.id === "stone")!,
  blueprints: CORE_MATERIALS.find((m) => m.id === "ash-logs")!,
  bases: CORE_MATERIALS.find((m) => m.id === "granite")!,
  density: CORE_MATERIALS.find((m) => m.id === "copper-ore")!,
} as const;
