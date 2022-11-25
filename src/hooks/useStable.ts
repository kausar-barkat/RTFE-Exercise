import * as Eq from "fp-ts/lib/Eq";
import { useRef } from "react";

export const useStable = <A>(a: A, eqA: Eq.Eq<A>) => {
  const refA = useRef<A>(a);
  if (!eqA.equals(a, refA.current)) {
    refA.current = a;
  }
  return refA.current;
};
