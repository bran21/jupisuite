import axios from "axios";
import { config } from "../config.js";

const jupApi = axios.create({
  baseURL: config.jupiterBaseUrl,
  headers: {
    "x-api-key": config.jupiterApiKey,
    "Content-Type": "application/json",
  },
});

export { jupApi };

/**
 * Common Jupiter API headers
 */
export function jupHeaders(jwt?: string): Record<string, string> {
  const h: Record<string, string> = {
    "x-api-key": config.jupiterApiKey,
    "Content-Type": "application/json",
  };
  if (jwt) h["Authorization"] = `Bearer ${jwt}`;
  return h;
}
