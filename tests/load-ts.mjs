import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// Exercise the real TypeScript modules without adding a test framework.
export function loadTs(path, overrides = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
  });
  const loadedModule = { exports: {} };
  const load = (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  new Function('require', 'module', 'exports', outputText)(load, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
