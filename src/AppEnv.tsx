import { HttpClient, HttpClientEnv } from "./service/http/HttpClient";
import { HttpJsonError } from "./service/http/HttpError";

import {
  CacheService,
  CacheServiceEnv,
  makeLocalStorageCacheService,
} from "./service/cache/CacheService";
import {
  BreedService,
  BreedServiceEnv,
  makeBreedService,
} from "./service/domain/DogService";
import { fetchHttpClient } from "./service/http/fetchHttpClient";
import { LocalStorage, LocalStorageEnv } from "./localStorage/LocalStorage";
import { domLocalStorage } from "./localStorage/DomLocalStorage";

const httpClient: HttpClient = fetchHttpClient;

export const httpClientEnv: HttpClientEnv = {
  httpClient,
};

const localStorage: LocalStorage = domLocalStorage;

export const localStorageEnv: LocalStorageEnv = {
  localStorage,
};

export const cacheService: CacheService =
  makeLocalStorageCacheService(localStorageEnv);

export const cacheServiceEnv: CacheServiceEnv = {
  cacheService,
};

export const breedService: BreedService<HttpJsonError> = makeBreedService({
  ...httpClientEnv,
  ...cacheServiceEnv,
});

export const breedServiceEnv: BreedServiceEnv<HttpJsonError> = {
  breedService,
};

export type AppEnv = HttpClientEnv &
  LocalStorageEnv &
  CacheServiceEnv &
  BreedServiceEnv<HttpJsonError>;

export const appEnv: AppEnv = {
  ...httpClientEnv,
  ...localStorageEnv,
  ...cacheServiceEnv,
  ...breedServiceEnv,
};
