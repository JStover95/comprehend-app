import http from "http";

/**
 * Resets moto (AWS service mocking) state
 * This should be called after each test to ensure clean state
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await resetMoto();
 * });
 * ```
 */
export function resetMoto(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: "/moto-api/reset",
        method: "POST",
      },
      (res) => {
        res.on("end", () => resolve());
        res.resume();
      },
    );
    req.on("error", reject);
    req.end();
  });
}
