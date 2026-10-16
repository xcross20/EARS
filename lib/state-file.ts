import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function earsStateDir(): string {
  if (process.env.EARS_STATE_DIR) {
    return process.env.EARS_STATE_DIR;
  }
  if (process.env.VITEST) {
    return path.join(tmpdir(), `ears-vitest-${process.pid}`);
  }
  return path.join(tmpdir(), "ears-demo-state");
}

export function readStateFile(name: string): unknown {
  const file = path.join(earsStateDir(), name);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw new Error(`EARS state file ${name} is unreadable`);
  }
}

export function writeStateFile(name: string, value: unknown): void {
  const dir = earsStateDir();
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(value));
  renameSync(temporary, file);
}

export function removeStateFile(name: string): void {
  rmSync(path.join(earsStateDir(), name), { force: true });
}
