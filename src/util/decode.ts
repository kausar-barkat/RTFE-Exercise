import { E, pipe } from "./fptsImports";
import * as t from "io-ts";

export type DecodeError = { tag: "decodeError"; errors: t.Errors };

export const decodeError = (errors: t.Errors): DecodeError => ({
  tag: "decodeError",
  errors,
});

export const decodeWithCodec =
  <A>(codec: t.Type<A>) =>
  (value: unknown): E.Either<DecodeError, A> =>
    pipe(codec.decode(value), E.mapLeft(decodeError));
