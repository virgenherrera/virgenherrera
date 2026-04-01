import { getSecrets } from "../../../libs/secrets/src/index.ts";

const secrets = getSecrets();
const payload = JSON.stringify({
  email: secrets.PROFILE_EMAIL,
  phone: secrets.PROFILE_PHONE,
});
const base64 = Buffer.from(payload).toString("base64");
const url = `https://virgenherrera.github.io/virgenherrera/#${base64}`;

console.log("\nRecruiter link:");
console.log(url);
console.log("\nPayload (for testing):");
console.log(`#${base64}`);
