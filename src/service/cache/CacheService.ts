import * as t from "io-ts";
import { TE, RTE, R } from "../../util/fptsImports";
import { pipe } from "fp-ts/lib/function";
import {
  getItemWithCache,
  LocalStorageEnv,
} from "../../localStorage/LocalStorage";
import { DecodeError } from "../../util/decode";

export interface CacheService {
  getWithCache<RGet, EGet, A>(
    key: string,
    codec: t.Type<A>,
    get: RTE.ReaderTaskEither<RGet, EGet, A>
  ): RTE.ReaderTaskEither<RGet, EGet | DecodeError, A>;

  clear: TE.TaskEither<never, void>;
}

export interface CacheServiceEnv {
  cacheService: CacheService;
}

export const getWithCache = <RGet, EGet, A>(
  key: string,
  codec: t.Type<A>,
  get: RTE.ReaderTaskEither<RGet, EGet, A>
): RTE.ReaderTaskEither<CacheServiceEnv & RGet, EGet | DecodeError, A> =>
  pipe(
    RTE.ask<CacheServiceEnv>(),
    RTE.chainW((env) => env.cacheService.getWithCache(key, codec, get))
  );

export const clear: RTE.ReaderTaskEither<CacheServiceEnv, never, void> = pipe(
  RTE.ask<CacheServiceEnv>(),
  RTE.chainTaskEitherKW((env) => env.cacheService.clear)
);

export const makeLocalStorageCacheService: R.Reader<
  LocalStorageEnv,
  CacheService
> = (LocalStorageEnv): CacheService => ({
  getWithCache: <RGet, EGet, A>(
    key: string,
    codec: t.Type<A>,
    get: RTE.ReaderTaskEither<RGet, EGet, A>
  ) =>
    pipe(
      RTE.ask<RGet>(),
      RTE.chainTaskEitherKW((r) =>
        getItemWithCache(key, codec, get)({ ...LocalStorageEnv, ...r })
      )
    ),

  clear: TE.fromIO(LocalStorageEnv.localStorage.clear),
});
