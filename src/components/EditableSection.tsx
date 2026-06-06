"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Props = { id: string; label: string; children: React.ReactNode };

function EditableSectionInner({ id, label, children }: Props) {
  const searchParams = useSearchParams();
  const editMode = searchParams.get("__edit") === "1";
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "bd-select-section" && e.data.sectionId === id) {
        setSelected(true);
        document
          .getElementById(`editable-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (e.data.type === "bd-deselect-all") {
        setSelected(false);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [id]);

  if (!editMode) return <>{children}</>;

  return (
    <div
      id={`editable-${id}`}
      onClick={(e) => {
        e.stopPropagation();
        window.parent.postMessage(
          { type: "bd-edit-section", sectionId: id, label },
          "*"
        );
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="editable-wrap relative"
      data-hovered={hovered && !selected ? "" : undefined}
      data-selected={selected ? "" : undefined}
    >
      {(hovered || selected) && (
        <div className="editable-label">{label}</div>
      )}
      {children}
    </div>
  );
}

// Suspense boundary ensures the fallback (just children) matches
// server-rendered HTML, preventing hydration mismatches.
export default function EditableSection(props: Props) {
  return (
    <Suspense fallback={<>{props.children}</>}>
      <EditableSectionInner {...props} />
    </Suspense>
  );
}
