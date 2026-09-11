import fs from "node:fs";
import path from "node:path";
import * as module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceExtensions = [".ts", ".tsx", ".mts"];
type ResolveContext = { parentURL: string };
type ResolveResult = { url: string; shortCircuit: true };
type NextResolve = (specifier: string, context: ResolveContext) => ResolveResult;
type ResolveHook = (
  specifier: string,
  context: ResolveContext,
  nextResolve: NextResolve,
) => ResolveResult;

const registerHooks = (module as unknown as {
  registerHooks: (hooks: { resolve: ResolveHook }) => void;
}).registerHooks;

function resolveSourceFile(candidate: string) {
  if (path.extname(candidate) && fs.existsSync(candidate)) return candidate;
  for (const extension of sourceExtensions) {
    if (fs.existsSync(`${candidate}${extension}`)) return `${candidate}${extension}`;
  }
  for (const extension of sourceExtensions) {
    const index = path.join(candidate, `index${extension}`);
    if (fs.existsSync(index)) return index;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const root = process.cwd();
    const sourcePath = specifier.startsWith("@/")
      ? path.join(root, specifier.slice(2))
      : specifier.startsWith("./") || specifier.startsWith("../")
        ? path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    if (sourcePath) {
      const resolved = resolveSourceFile(sourcePath);
      if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
