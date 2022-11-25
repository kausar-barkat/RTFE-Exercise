import * as TE from "fp-ts/lib/TaskEither";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import {
  HttpContentTypeError,
  HttpJsonError,
  HttpRequestError,
  httpResponseStatusError,
  HttpResponseStatusError,
} from "./HttpError";
import { DecodeError } from "../../util/decode";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  headers?: Record<string, string>;
  getBodyAsJson: TE.TaskEither<HttpContentTypeError<"json">, unknown>;
  getBodyAsText: TE.TaskEither<HttpContentTypeError<"text">, string>;
}

export interface HttpClient {
  sendRequest(
    request: HttpRequest
  ): TE.TaskEither<HttpRequestError, HttpResponse>;
}

export interface HttpClientEnv {
  httpClient: HttpClient;
}

export const sendRequest = (
  httpRequest: HttpRequest
): RTE.ReaderTaskEither<HttpClientEnv, HttpRequestError, HttpResponse> =>
  pipe(
    RTE.asks((m: HttpClientEnv) => m.httpClient),
    RTE.chainTaskEitherKW((httpClient) => httpClient.sendRequest(httpRequest))
  );

export const ensureStatusRange =
  (minInclusive: number, maxExclusive: number) =>
  (
    httpResponse: HttpResponse
  ): E.Either<HttpResponseStatusError, HttpResponse> =>
    httpResponse.status >= minInclusive && httpResponse.status < maxExclusive
      ? E.right(httpResponse)
      : E.left(
          httpResponseStatusError(
            httpResponse,
            httpResponse.status,
            minInclusive,
            maxExclusive
          )
        );

export const ensure = ensureStatusRange(200, 300);

export const getJson = <A>(
  url: string,
  decode: (raw: unknown) => E.Either<DecodeError, A>
): RTE.ReaderTaskEither<HttpClientEnv, HttpJsonError, A> =>
  pipe(
    sendRequest({ method: "GET", url }),
    RTE.chainEitherKW(ensure),
    RTE.chainTaskEitherKW((response) => response.getBodyAsJson),
    RTE.chainEitherKW(decode)
  );
