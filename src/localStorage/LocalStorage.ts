import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { DecodeError, decodeWithCodec } from "../util/decode";

import { E, IO, O, RTE } from "../util/fptsImports";
export interface LocalStorage {
  getItem(key: string): IO.IO<O.Option<string>>;
  setItem(key: string, value: string): IO.IO<void>;
  clear: IO.IO<void>;
}

export interface LocalStorageEnv {
  localStorage: LocalStorage;
}

export const getItem = (
  key: string
): RTE.ReaderTaskEither<LocalStorageEnv, never, O.Option<string>> =>
  pipe(
    RTE.ask<LocalStorageEnv>(),
    RTE.chain((env) => RTE.fromIO(env.localStorage.getItem(key)))
  );

export const setItem = (
  key: string,
  value: string
): RTE.ReaderTaskEither<LocalStorageEnv, never, void> =>
  pipe(
    RTE.ask<LocalStorageEnv>(),
    RTE.chain((env) => RTE.fromIO(env.localStorage.setItem(key, value)))
  );

export const clear: RTE.ReaderTaskEither<LocalStorageEnv, never, void> = pipe(
  RTE.ask<LocalStorageEnv>(),
  RTE.chain((env) => RTE.fromIO(env.localStorage.clear))
);

export const getItemWithDecode = <E, A>(
  key: string,
  decode: (raw: unknown) => E.Either<E, A>
): RTE.ReaderTaskEither<LocalStorageEnv, E, O.Option<A>> =>
  pipe(
    getItem(key),
    RTE.chainEitherKW((itemStringOpt) =>
      pipe(
        itemStringOpt,
        O.fold(
          (): E.Either<E, O.Option<A>> => E.right(O.none),
          (itemString) => pipe(itemString, JSON.parse, decode, E.map(O.some))
        )
      )
    )
  );

export const setItemWithEncode = <A>(
  key: string,
  item: A,
  encode: (a: A) => unknown
): RTE.ReaderTaskEither<LocalStorageEnv, never, void> =>
  pipe(item, encode, JSON.stringify, (value) => setItem(key, value));

export const getItemWithCache = <RGet, EGet, A>(
  key: string,
  codec: t.Type<A>,
  get: RTE.ReaderTaskEither<RGet, EGet, A>
): RTE.ReaderTaskEither<LocalStorageEnv & RGet, EGet | DecodeError, A> =>
  pipe(
    getItemWithDecode(key, decodeWithCodec(codec)),
    RTE.chainW((dataOpt) =>
      pipe(
        dataOpt,
        O.fold(
          () =>
            pipe(
              get,
              RTE.chainW((data) =>
                pipe(
                  setItemWithEncode(key, data, codec.encode),
                  RTE.map((_) => data)
                )
              )
            ),
          RTE.right
        )
      )
    )
  );
