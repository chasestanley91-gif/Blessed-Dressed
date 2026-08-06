import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { fetchAllOptionImages } from "../helpers/catalog";

/**
 * Deploy integrity for craft-option imagery.
 *
 * localhost serves `public/` straight off the developer's disk, so a file that
 * is gitignored — or excluded from the Vercel upload — looks perfectly healthy
 * in every browser test in this suite and 404s the moment it ships. That class
 * of bug is invisible to e2e-on-localhost by construction, which is exactly why
 * it deserves its own check.
 */

const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Minimal, conservative gitignore-style matcher for .vercelignore patterns. */
function vercelIgnoreMatchers(): { pattern: string; test: (file: string) => boolean }[] {
  const file = path.join(REPO_ROOT, ".vercelignore");
  if (!existsSync(file)) return [];

  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"))
    .map((pattern) => {
      const normalised = pattern.replace(/^\/+/, "").replace(/\/+$/, "");
      if (normalised.includes("*")) {
        const source = normalised
          .split("**")
          .map((part) => part.split("*").map(escapeRegExp).join("[^/]*"))
          .join(".*")
          .replace(/\/\.\*\//g, "/(?:.*/)?");
        const regex = new RegExp(`^${source}$`);
        return { pattern, test: (f: string) => regex.test(f) };
      }
      return {
        pattern,
        test: (f: string) => f === normalised || f.startsWith(`${normalised}/`),
      };
    });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

/** Paths git refuses to track, resolved by git itself rather than re-parsed. */
function gitIgnored(repoPaths: string[]): string[] {
  if (repoPaths.length === 0) return [];
  try {
    const stdout = execFileSync("git", ["check-ignore", "--stdin"], {
      cwd: REPO_ROOT,
      input: repoPaths.join("\n"),
      encoding: "utf8",
    });
    return stdout.split(/\r?\n/).filter(Boolean);
  } catch (error) {
    // git check-ignore exits 1 when NOTHING matched — the healthy case.
    const err = error as { status?: number; stdout?: string };
    if (err.status === 1) return (err.stdout ?? "").split(/\r?\n/).filter(Boolean);
    throw error;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * REGRESSION GUARD — BUG D1 is FIXED; this test now passes and must keep
 * passing. Do not weaken it and do not re-add `test.fail()`.
 * ══════════════════════════════════════════════════════════════════════════ */

test.describe("deploy integrity", () => {
  /**
   * BUG D1 (fixed) — the catalog once served 58 option images from
   * `public/images/factory/`, which is excluded twice over:
   *
   *   .gitignore:46   /public/images/factory/
   *   .vercelignore   public/images/factory
   *
   * Those files exist only on the machine that scraped them, so on a fresh
   * clone, on CI and in production every one 404'd — while passing locally,
   * because the files were sitting right there on this disk. The catalog now
   * holds zero `/images/factory` references.
   *
   * This is the class of failure localhost structurally cannot catch, which is
   * why the check reads .gitignore and .vercelignore rather than the filesystem.
   * If it fails again, move the referenced files into a tracked, shipped
   * directory and repoint the catalog — never delete this test.
   */
  test(
    "every served option image is committed and included in the deploy",
    async ({ request }) => {
      test.setTimeout(120_000);

      const served = await fetchAllOptionImages(request);
      const repoPaths = served.map((p) => `public${decodeURIComponent(p)}`);

      const ignoredByGit = gitIgnored(repoPaths);

      const matchers = vercelIgnoreMatchers();
      const excludedFromDeploy = repoPaths.filter((p) =>
        matchers.some((m) => m.test(p.replace(/\\/g, "/")))
      );

      const summarise = (list: string[]) => {
        const byDirectory = new Map<string, number>();
        for (const item of list) {
          const key = item.split("/").slice(0, 4).join("/");
          byDirectory.set(key, (byDirectory.get(key) ?? 0) + 1);
        }
        return [...byDirectory].map(([dir, count]) => `${count} under ${dir}/`);
      };

      expect(
        summarise(ignoredByGit),
        "option images referenced by the catalog but excluded by .gitignore — " +
          "they do not exist on a fresh clone"
      ).toEqual([]);

      expect(
        summarise(excludedFromDeploy),
        "option images referenced by the catalog but excluded by .vercelignore — " +
          "they 404 in production"
      ).toEqual([]);
    }
  );
});
