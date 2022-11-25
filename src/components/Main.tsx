import React, { useReducer, useState } from "react";
import { breedServiceEnv, cacheServiceEnv, httpClientEnv } from "../AppEnv";
import {
  useAppEnvReducer,
  useAppEnvRemoteData,
  useAppEnvRT,
  useAppEnvRTE,
} from "../hooks/useAppEnv";
import { BreedServiceContext, useBreedsRD } from "../hooks/useDomain";
import { useIO } from "../hooks/useIO";
import { Breed } from "../model/Breeds";
import { getBreeds, getBreedsWithCache } from "../service/domain/DogService";
import { HttpJsonError } from "../service/http/HttpError";
import { E, Eq, pipe, RD, RT, RTE } from "../util/fptsImports";
import { Breeds } from "./Breeds";
export * as RD from "@devexperts/remote-data-ts";
export * as RTE from "fp-ts/lib/ReaderTaskEither";

export const MainRTEWithGlobalDeps = () => {
  const [remoteData, setRemoteData] = useState<
    RD.RemoteData<HttpJsonError, Array<Breed>>
  >(RD.initial);

  useIO(
    () => {
      setRemoteData(RD.pending);
      RTE.run(getBreedsWithCache, {
        ...httpClientEnv,
        ...cacheServiceEnv,
      }).then(
        E.fold(
          (e) => setRemoteData(RD.failure(e)),
          (b) => setRemoteData(RD.success(b))
        )
      );
    },
    [],
    Eq.getTupleEq()
  );

  return <Breeds breedsRD={remoteData} />;
};
export const MainAppEnvRT = () => {
  const [breedsRD, setBreedsRD] = useState<
    RD.RemoteData<HttpJsonError, Array<Breed>>
  >(RD.initial);

  useAppEnvRT({
    rt: pipe(
      getBreeds,
      RTE.fold(
        (e: HttpJsonError) =>
          RT.fromIO(() => {
            setBreedsRD(RD.failure(e));
          }),
        (breeds: Array<Breed>) =>
          RT.fromIO(() => {
            setBreedsRD(RD.success(breeds));
          })
      )
    ),
    deps: [],
    eqDeps: Eq.getTupleEq(),
  });

  return <Breeds breedsRD={breedsRD} />;
};
export const MainAppEnvRTE = () => {
  const [breedsRD, setBreedsRD] = useState<
    RD.RemoteData<HttpJsonError, Array<Breed>>
  >(RD.initial);

  useAppEnvRTE({
    rte: getBreeds,
    onBefore: () => setBreedsRD(RD.pending),
    onError: (error) => setBreedsRD(RD.failure(error)),
    onSuccess: (breeds) => setBreedsRD(RD.success(breeds)),
    deps: [],
    eqDeps: Eq.getTupleEq(),
  });

  return <Breeds breedsRD={breedsRD} />;
};
export const MainAppEnvRemoteData = () => {
  const breedsRD = useAppEnvRemoteData({
    rte: getBreeds,
    deps: [],
    eqDeps: Eq.getTupleEq(),
  });

  return <Breeds breedsRD={breedsRD} />;
};
type LoadingBreeds = { type: "loadingBreeds" };
type FailedBreeds = { type: "failedBreeds"; error: HttpJsonError };
type LoadedBreeds = { type: "loadedBreeds"; breeds: Array<Breed> };

type Action = LoadingBreeds | FailedBreeds | LoadedBreeds;

type State = { breedsRD: RD.RemoteData<HttpJsonError, Array<Breed>> };

const initialState = { breedsRD: RD.initial };

type Reducer = (state: State, action: Action) => State;

const reducer: Reducer = (_state, action) => {
  switch (action.type) {
    case "loadingBreeds":
      return { breedsRD: RD.pending };
    case "failedBreeds":
      return { breedsRD: RD.failure(action.error) };
    case "loadedBreeds":
      return { breedsRD: RD.success(action.breeds) };
  }
};
export const MainAppEnvReducer = () => {
  const [state, dispatch] = useReducer<Reducer>(reducer, initialState);
  useAppEnvReducer({
    rte: getBreedsWithCache,
    dispatch,
    getBeforeAction: (): Action => ({ type: "loadingBreeds" }),
    getErrorAction: (error): Action => ({ type: "failedBreeds", error }),
    getSuccessAction: (breeds): Action => ({
      type: "loadedBreeds",
      breeds,
    }),
    deps: [],
    eqDeps: Eq.getTupleEq(),
  });

  return <Breeds breedsRD={state.breedsRD} />;
};

export const MainBreedService = () => {
  const breedsRD = useBreedsRD();

  return <Breeds breedsRD={breedsRD} />;
};

export const Main = () => {
  return (
    <BreedServiceContext.Provider value={breedServiceEnv}>
      <MainBreedService />
    </BreedServiceContext.Provider>
  );
};
