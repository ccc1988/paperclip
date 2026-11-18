import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const localeDir = path.join(root, "ui", "src", "i18n", "locales");
const referencePath = path.join(localeDir, "en.json");
const candidatePath = path.join(localeDir, "zh-CN.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flatten(value, prefix = [], output = new Map()) {
  if (typeof value === "string") {
    output.set(prefix.join("."), value);
    return output;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected an object or string at ${prefix.join(".") || "<root>"}`);
  }
  for (const [key, child] of Object.entries(value)) flatten(child, [...prefix, key], output);
  return output;
}

function placeholders(value) {
  return [...value.matchAll(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g)].map(match => match[1]).sort();
}

const reference = flatten(readJson(referencePath));
const candidate = flatten(readJson(candidatePath));
const errors = [];

for (const key of reference.keys()) {
  if (!candidate.has(key)) errors.push(`${key}: missing`);
}
for (const key of candidate.keys()) {
  if (!reference.has(key)) errors.push(`${key}: not defined in en.json`);
}
for (const [key, english] of reference) {
  const translated = candidate.get(key);
  if (translated === undefined) continue;
  if (!translated.trim()) errors.push(`${key}: empty translation`);
  if (JSON.stringify(placeholders(english)) !== JSON.stringify(placeholders(translated))) {
    errors.push(`${key}: interpolation placeholders differ`);
  }
}

if (errors.length > 0) {
  console.error(`i18n audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`i18n audit passed: ${candidate.size} zh-CN messages match en.json`);
