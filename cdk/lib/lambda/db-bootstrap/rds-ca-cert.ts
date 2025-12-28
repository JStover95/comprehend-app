import * as https from "https";

/**
 * RDS CA certificate bundle URL
 * AWS provides this bundle for verifying RDS SSL certificates
 */
const RDS_CA_BUNDLE_URL =
  "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem";

/**
 * Cached RDS CA certificate bundle
 * Fetched once and reused for all connections
 */
let cachedCaCert: string | null = null;

/**
 * Fetches the RDS CA certificate bundle from AWS's trust store
 *
 * The certificate is cached after the first fetch to avoid repeated
 * network calls for subsequent connections.
 *
 * @returns RDS CA certificate bundle as a string
 * @throws Error if the certificate cannot be fetched
 */
export async function getRdsCaCert(): Promise<string> {
  // Return cached certificate if available
  if (cachedCaCert !== null) {
    return cachedCaCert;
  }

  return new Promise((resolve, reject) => {
    https
      .get(RDS_CA_BUNDLE_URL, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Failed to fetch RDS CA certificate: HTTP ${res.statusCode}`,
            ),
          );
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (!data) {
            reject(new Error("RDS CA certificate bundle is empty"));
            return;
          }

          // Cache the certificate
          cachedCaCert = data;
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(
          new Error(`Failed to fetch RDS CA certificate: ${error.message}`),
        );
      });
  });
}
