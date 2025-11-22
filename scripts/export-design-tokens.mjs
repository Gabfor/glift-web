import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve("src/constants/design-tokens.json");
const publicJsonPath = resolve("public/design-tokens.json");
const publicArbPath = resolve("public/design-tokens.arb");

const tokens = JSON.parse(readFileSync(sourcePath, "utf-8"));

writeFileSync(publicJsonPath, JSON.stringify(tokens, null, 2) + "\n");

const flattenTokens = (object, prefix = []) => {
  return Object.entries(object).reduce((acc, [key, value]) => {
    const newKey = [...prefix, key].join(".");

    if (typeof value === "object" && value !== null) {
      Object.assign(acc, flattenTokens(value, [...prefix, key]));
    } else {
      acc[newKey] = String(value);
    }

    return acc;
  }, {});
};

const arbPayload = {
  "@@locale": "fr",
  ...flattenTokens(tokens),
};

writeFileSync(publicArbPath, JSON.stringify(arbPayload, null, 2) + "\n");

console.log(`Design tokens exported to ${publicJsonPath} and ${publicArbPath}`);
