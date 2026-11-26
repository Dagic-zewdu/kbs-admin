// The ONNX Runtime engine files the expiry-date reader loads, served from public/ort/<version>/ (not committed)
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";

const from = "node_modules/onnxruntime-web/dist";
const { version } = JSON.parse(readFileSync("node_modules/onnxruntime-web/package.json", "utf8"));
rmSync("public/ort", { recursive: true, force: true });
mkdirSync(`public/ort/${version}`, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) copyFileSync(`${from}/${file}`, `public/ort/${version}/${file}`);
console.log(`ONNX Runtime ${version} copied to public/ort`);
