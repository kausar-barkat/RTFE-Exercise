import React, { useContext, useState } from "react";
import { appEnv, AppEnv } from "../AppEnv";
import { Eq, pipe, RD, RT, RTE } from "../util/fptsImports";

import { useIO } from "./useIO";

export const AppEnvContext = React.createContext(appEnv);

export const useAppEnv = () => {
  return useContext(AppEnvContext);
};
export const useAppEnvRT = <Deps extends Array<unknown>>({
  rt,
  deps,
  eqDeps,
}: {
  rt: RT.ReaderTask<AppEnv, void>;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}) => {
  const env = useAppEnv();

  useIO(
    () => {
      RT.run(rt, env);
    },
    deps,
    eqDeps
  );
};
export const useAppEnvRTE = <E, A, Deps extends Array<unknown>>({
  rte,
  onBefore,
  onError,
  onSuccess,
  deps,
  eqDeps,
}: {
  rte: RTE.ReaderTaskEither<AppEnv, E, A>;
  onBefore: () => void;
  onError: (e: E) => void;
  onSuccess: (a: A) => void;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}): void => {
  const rt: RT.ReaderTask<AppEnv, void> = pipe(
    RTE.fromIO(onBefore),
    RTE.chain((_) => rte),
    RTE.fold<AppEnv, E, A, void>(
      (e) =>
        RT.fromIO(() => {
          onError(e);
        }),
      (a) =>
        RT.fromIO(() => {
          onSuccess(a);
        })
    )
  );
  useAppEnvRT({
    rt,
    deps,
    eqDeps,
  });
};
export const useAppEnvReducer = <E, A, Action, Deps extends Array<unknown>>({
  rte,
  getBeforeAction,
  getErrorAction,
  getSuccessAction,
  dispatch,
  deps,
  eqDeps,
}: {
  rte: RTE.ReaderTaskEither<AppEnv, E, A>;
  getBeforeAction: () => Action;
  getErrorAction: (e: E) => Action;
  getSuccessAction: (a: A) => Action;
  dispatch: (a: Action) => void;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}): void =>
  useAppEnvRTE({
    rte,
    onBefore: () => dispatch(getBeforeAction()),
    onSuccess: (a) => dispatch(getSuccessAction(a)),
    onError: (e) => dispatch(getErrorAction(e)),
    deps,
    eqDeps,
  });

export const useAppEnvRemoteData = <E, A, Deps extends Array<unknown>>({
  rte,
  deps,
  eqDeps,
}: {
  rte: RTE.ReaderTaskEither<AppEnv, E, A>;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}): RD.RemoteData<E, A> => {
  const [remoteData, setRemoteData] = useState<RD.RemoteData<E, A>>(RD.initial);

  useAppEnvRTE({
    rte,
    onBefore: () => setRemoteData(RD.pending),
    onError: (e) => setRemoteData(RD.failure(e)),
    onSuccess: (a) => setRemoteData(RD.success(a)),
    deps,
    eqDeps,
  });

  return remoteData;
};
