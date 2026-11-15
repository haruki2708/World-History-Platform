// Lets plain Node run the TypeScript in src/ without a build step, for the
// scripts in this folder:
//
//   node --import ./src/server/tutor/tools/register.mjs <script.ts>
//
// Node strips the types itself (Node 22.18+ / 24). These hooks add the three
// things the bundler normally provides: the "@/" alias, imports written
// without a file extension, and JSON imports. "server-only" becomes a no-op.

import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const srcUrl = pathToFileURL(srcDir).href;

function findFile(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
  return candidates.find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
  );
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,", shortCircuit: true };
    }

    let base;
    if (specifier.startsWith("@/")) {
      base = path.join(srcDir, specifier.slice(2));
    } else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      if (parentDir.startsWith(srcDir)) base = path.resolve(parentDir, specifier);
    }

    const file = base && findFile(base);
    const result = file
      ? { url: pathToFileURL(file).href, shortCircuit: true }
      : nextResolve(specifier, context);
    // The project's package.json has no "type"; say outright that its
    // TypeScript files are ES modules so Node does not have to guess.
    if (/\.tsx?$/.test(result.url) && result.url.startsWith(srcUrl)) {
      return { ...result, format: "module-typescript" };
    }
    return result;
  },

  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".json")) {
      const json = readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module",
        source: `export default ${json};`,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
