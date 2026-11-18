// Les modules préparés à la construction de la démo (vite.demo.config.ts).

declare module "virtual:icones-demo" {
  /** « mdi:lightbulb » → le tracé SVG de l'icône. */
  const icones: Record<string, string>;
  export default icones;
}

declare module "virtual:theme-demo" {
  /** Les variables CSS du thème Automatic Dashboard, en clair et en sombre. */
  const css: string;
  export default css;
}
