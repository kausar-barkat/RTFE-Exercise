import { O } from "../util/fptsImports";
import { LocalStorage } from "./LocalStorage";

export const domLocalStorage: LocalStorage = {
  getItem: (key: string) => () => O.fromNullable(localStorage.getItem(key)),

  setItem: (key: string, value: string) => () =>
    localStorage.setItem(key, value),

  clear: () => localStorage.clear(),
};
