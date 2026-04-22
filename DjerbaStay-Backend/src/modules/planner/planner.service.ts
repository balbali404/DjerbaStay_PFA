import { Prisma } from "@prisma/client";

import { env } from "../../config/env";
import { createHttpError } from "../../utils/httpError";

export type FlaskCallResult = {
  status: number;
  data: unknown;
};

export async function requestFlaskJson(path: string, payload: unknown): Promise<FlaskCallResult> {
  const response = await fetch(`${env.aiServiceUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = { raw: rawBody };
    }
  }

  if (!response.ok) {
    const fallbackMessage = `Flask service error (${response.status})`;
    const errorMessage =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : fallbackMessage;

    throw createHttpError(502, errorMessage);
  }

  return {
    status: response.status,
    data: parsedBody,
  };
}

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
