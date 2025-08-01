import createClient from "node-vault";
import { fromContainerMetadata } from "@aws-sdk/credential-providers";
import { sign } from "aws4";

let vault: createClient.client | null = null;

const secretCache: Record<string, string> = {};

export async function getSecret(secretName: string) {
  if (process.env.NODE_ENV !== "production") {
    return process.env[secretName];
  }

  if (secretCache[secretName]) {
    return secretCache[secretName];
  }

  const client = vault ?? createClient({ endpoint: process.env.VAULT_ADDR });

  if (!vault) {
    const response = await client.awsIamLogin(await getIamRequest());
    client.token = response.auth.client_token;

    vault = client;
  }

  const secretRequest = await vault.read(
    `kv/data/${process.env.VAULT_APPLICATION}/${secretName}`,
  );

  const secret = secretRequest.data.data.value;

  secretCache[secretName] = secret;

  return secret;
}

const base64 = (str: string) => Buffer.from(str).toString("base64");

const STS_BODY = "Action=GetCallerIdentity&Version=2011-06-15";

const STS_HOST = `sts.${process.env.AWS_REGION}.amazonaws.com`;

async function getIamRequest() {
  const credentials = await fromContainerMetadata()();

  const request = {
    service: "sts",
    body: STS_BODY,
    method: "POST",
    host: STS_HOST,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    region: process.env.AWS_REGION,
  };

  const signedRequest = sign(request, credentials);

  return {
    role: process.env.TASK_ROLE,
    iam_http_request_method: "POST",
    iam_request_url: base64(`https://${STS_HOST}`),
    iam_request_body: base64(STS_BODY),
    iam_request_headers: base64(JSON.stringify(signedRequest.headers)),
  };
}
