"use client";

import { useEffect } from "react";
import type { OverrideMap } from "@/app/api/admin/image-overrides/route";

function resolveChain(
  src: string,
  map: OverrideMap,
  depth = 0
): { src: string; position?: string; zoom?: number } {
  if (depth > 10) return { src };
  const entry = map[src];
  if (!entry) return { src };
  return resolveChain(entry.src, map, depth + 1) ?? entry;
}

export default function ImageOverrideApplicator() {
  useEffect(() => {
    fetch("/api/admin/image-overrides")
      .then((r) => r.json())
      .then(({ overrides }: { overrides: OverrideMap }) => {
        if (!overrides || Object.keys(overrides).length === 0) return;

        function applyToImg(img: HTMLImageElement) {
          // Determine the canonical original src (root-relative)
          const raw = img.getAttribute("src") || img.src;
          const original = raw.startsWith("http")
            ? new URL(raw).pathname
            : raw;

          const resolved = resolveChain(original, overrides);
          if (resolved.src !== original) {
            img.src = resolved.src;
            if (resolved.position) {
              img.style.objectPosition = resolved.position;
            }
            // Apply zoom — containers already have overflow-hidden so
            // zoomed images won't bleed outside their bounds.
            if (resolved.zoom && resolved.zoom !== 1) {
              img.style.transform = `scale(${resolved.zoom})`;
            } else {
              img.style.transform = "";
            }
            // tag so GlobalEditMode knows the canonical original
            img.setAttribute("data-bd-original", original);
          }
        }

        document
          .querySelectorAll<HTMLImageElement>("img:not([data-bd-admin])")
          .forEach(applyToImg);

        // Also apply to images added later (GSAP reveals, lazy-loaded content)
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            m.addedNodes.forEach((node) => {
              if (node instanceof HTMLImageElement) applyToImg(node);
              if (node instanceof Element) {
                node
                  .querySelectorAll<HTMLImageElement>("img:not([data-bd-admin])")
                  .forEach(applyToImg);
              }
            });
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // no cleanup needed — observer lives for the page lifetime
      })
      .catch(() => {});
  }, []);

  return null;
}
