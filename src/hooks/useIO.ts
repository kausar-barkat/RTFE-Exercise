import * as IO from "fp-ts/lib/IO";
import { useEffect } from "react";
import { useStable } from "./useStable";
import { Eq } from "../util/fptsImports";

export const useIO = <T extends Array<unknown>>(
  io: IO.IO<void>,
  dependencies: T,
  eq: Eq.Eq<T>
) => {
  const deps = useStable(dependencies, eq);
  useEffect(() => {
    io();
  }, deps);
};
