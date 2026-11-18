// Le type d'une langue : celui du français, la langue de référence, avec du texte quelconque à
// la place de chaque phrase. Une nouvelle langue doit avoir exactement les mêmes clés, et des
// fonctions qui prennent les mêmes paramètres.
import type { fr } from "./fr";

type Elargir<T> = T extends (...a: infer P) => infer R
  ? (...a: P) => R extends string ? string : R
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? Elargir<U>[]
      : T extends object
        ? { [K in keyof T]: Elargir<T[K]> }
        : T;

export type Langue = Elargir<typeof fr>;
