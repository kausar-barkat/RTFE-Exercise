import * as t from "io-ts";
import { getJson, HttpClientEnv } from "../http/HttpClient";
import { HttpJsonError } from "../http/HttpError";
import { Breed, breedCodec } from "../../model/Breeds";
import { A, R, Rec, RTE, TE } from "../../util/fptsImports";
import { pipe } from "fp-ts/lib/function";
import { CacheServiceEnv, getWithCache } from "../cache/CacheService";
import { decodeWithCodec } from "../../util/decode";

type GetBreedsResponse = {
  message: Record<string, Array<string>>;
};

const getBreedsResponseCodec: t.Type<GetBreedsResponse> = t.type({
  message: t.record(t.string, t.array(t.string)),
});

export const getBreeds: RTE.ReaderTaskEither<
  HttpClientEnv,
  HttpJsonError,
  Array<Breed>
> = pipe(
  getJson(
    "https://dog.ceo/api/breeds/list/all",
    decodeWithCodec(getBreedsResponseCodec)
  ),
  RTE.map((response) =>
    pipe(
      Rec.toArray(response.message),
      A.map(([name, subBreeds]) => ({ name, subBreeds }))
    )
  )
);

export const getBreedsWithCache: RTE.ReaderTaskEither<
  HttpClientEnv & CacheServiceEnv,
  HttpJsonError,
  Array<Breed>
> = getWithCache("breeds", t.array(breedCodec), getBreeds);

export interface BreedService<E> {
  getBreeds: TE.TaskEither<E, Array<Breed>>;
}
export type BreedServiceEnv<E> = {
  breedService: BreedService<E>;
};

export const makeBreedService: R.Reader<
  HttpClientEnv & CacheServiceEnv,
  BreedService<HttpJsonError>
> = (env) => ({ getBreeds: getBreedsWithCache(env) });
