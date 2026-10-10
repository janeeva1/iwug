import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildContentLookup,
  contentGroupLabels,
  scalarContentDefaults,
  siteCollections,
  type ContentLookup,
} from "../shared/site-content";

export interface SiteContentPayload {
  fields: Record<string, { en: string; ig: string }>;
  collections: Record<string, Record<string, string>[]>;
}

export interface SiteContentValue {
  lookup: ContentLookup;
  collections: Record<string, Record<string, string>[]>;
}

export const SITE_CONTENT_QUERY_KEY = ["site-content"] as const;
const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function buildSiteContentValue(payload: SiteContentPayload | undefined): SiteContentValue {
  const lookup = buildContentLookup(scalarContentDefaults, payload?.fields ?? {});
  const collections: Record<string, Record<string, string>[]> = {};
  for (const collection of siteCollections) {
    collections[collection.id] = payload?.collections?.[collection.id] ?? collection.items;
  }
  return { lookup, collections };
}

export async function fetchSiteContent(): Promise<SiteContentPayload> {
  const res = await fetch(`${base}/api/content`);
  if (!res.ok) throw new Error(`Could not load site content (HTTP ${res.status}).`);
  return (await res.json()) as SiteContentPayload;
}

async function fetchAdminContent(): Promise<SiteContentPayload> {
  const res = await fetch(`${base}/api/admin/content`);
  if (!res.ok) throw new Error(`Could not load content for editing (HTTP ${res.status}).`);
  return (await res.json()) as SiteContentPayload;
}

export async function saveContentFields(fields: Record<string, { en: string; ig: string }>): Promise<SiteContentPayload> {
  const res = await fetch(`${base}/api/admin/content/fields`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Could not save copy (HTTP ${res.status}).`);
  return (await res.json()) as SiteContentPayload;
}

export async function saveContentCollection(
  collectionId: string,
  items: Record<string, string>[],
): Promise<SiteContentPayload> {
  const res = await fetch(`${base}/api/admin/content/collections/${collectionId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error(`Could not save “${collectionId}” (HTTP ${res.status}).`);
  return (await res.json()) as SiteContentPayload;
}

const ContentContext = createContext<SiteContentValue | null>(null);

export function SiteContentContextProvider({
  value,
  children,
}: {
  value: SiteContentValue;
  children: ReactNode;
}) {
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useSiteContent(): SiteContentValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useSiteContent must be used within a SiteContentContextProvider");
  return ctx;
}

let lookupRef: ContentLookup = {};

export function setContentLookup(lookup: ContentLookup): void {
  lookupRef = lookup;
}

/** Resolves a bilingual string, preferring any editor override for `en`. */
export function getContentValue(locale: "ig" | "en", ig: string, en: string): string {
  const override = lookupRef[en];
  return override ? (locale === "ig" ? override.ig : override.en) : locale === "ig" ? ig : en;
}

/** Admin editor for every editable string and collection. */
export function AdminContentPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-content"], queryFn: fetchAdminContent });
  const [fieldDraft, setFieldDraft] = useState<Record<string, { en: string; ig: string }>>({});
  const [collectionDraft, setCollectionDraft] = useState<Record<string, Record<string, string>[]>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setFieldDraft(query.data.fields);
    setCollectionDraft(query.data.collections);
  }, [query.data]);

  const refresh = async () => {
    await query.refetch();
    await queryClient.invalidateQueries({ queryKey: SITE_CONTENT_QUERY_KEY });
  };

  const saveFields = useMutation({
    mutationFn: saveContentFields,
    onSuccess: async () => {
      setNotice("Copy saved.");
      await refresh();
    },
    onError: (error: unknown) => setNotice(error instanceof Error ? error.message : "Save failed."),
  });

  const saveCollection = useMutation({
    mutationFn: ({ id, items }: { id: string; items: Record<string, string>[] }) => saveContentCollection(id, items),
    onSuccess: async () => {
      setNotice("Collection saved.");
      await refresh();
    },
    onError: (error: unknown) => setNotice(error instanceof Error ? error.message : "Save failed."),
  });

  if (query.isLoading) {
    return <p className="admin-private-note">Loading editable content…</p>;
  }
  if (query.error) {
    return (
      <div className="admin-data-status">
        <span className="eyebrow">CONTENT</span>
        <p>{query.error instanceof Error ? query.error.message : "Could not load content."}</p>
        <button className="btn-primary" onClick={() => void query.refetch()}>Retry</button>
      </div>
    );
  }

  const groups = new Map<string, typeof scalarContentDefaults>();
  for (const field of scalarContentDefaults) {
    const list = groups.get(field.group) ?? [];
    list.push(field);
    groups.set(field.group, list);
  }

  return (
    <div className="admin-content">
      <div className="admin-content-head">
        <p>{scalarContentDefaults.length} strings · {siteCollections.length} collections</p>
        <button
          type="button"
          className="btn-primary"
          disabled={saveFields.isPending}
          data-testid="button-save-content-fields"
          onClick={() => saveFields.mutate(fieldDraft)}
        >
          {saveFields.isPending ? "Saving…" : "Save all copy"}
        </button>
      </div>
      {notice && <p className="admin-private-note" role="status">{notice}</p>}
      {[...groups.entries()].map(([group, fields]) => (
        <section className="admin-content-group" key={group} data-testid={`content-group-${group}`}>
          <h3 className="serif">
            {contentGroupLabels[group]?.en ?? group}
            <small>{contentGroupLabels[group]?.ig}</small>
          </h3>
          {fields.map((field) => {
            const value = fieldDraft[field.id] ?? { en: field.en, ig: field.ig };
            return (
              <div className="content-field" key={field.id} data-testid={`content-field-${field.id}`}>
                <label>
                  <span>English</span>
                  <textarea
                    className="input"
                    rows={value.en.length > 80 ? 3 : 1}
                    value={value.en}
                    onChange={(e) =>
                      setFieldDraft((draft) => ({ ...draft, [field.id]: { en: e.target.value, ig: value.ig } }))
                    }
                  />
                </label>
                <label>
                  <span>Igbo</span>
                  <textarea
                    className="input"
                    rows={value.ig.length > 80 ? 3 : 1}
                    value={value.ig}
                    onChange={(e) =>
                      setFieldDraft((draft) => ({ ...draft, [field.id]: { en: value.en, ig: e.target.value } }))
                    }
                  />
                </label>
              </div>
            );
          })}
        </section>
      ))}
      {siteCollections.map((collection) => {
        const items = collectionDraft[collection.id] ?? collection.items;
        return (
          <section className="admin-content-group" key={collection.id} data-testid={`content-collection-${collection.id}`}>
            <h3 className="serif">
              {collection.label}
              <small>{items.length} items</small>
            </h3>
            {items.map((item, index) => (
              <div className="content-collection-row" key={`${collection.id}-${index}`}>
                {collection.columns.map((column) => (
                  <label key={column.key}>
                    <span>{column.label}</span>
                    <textarea
                      className="input"
                      rows={column.multiline ? 2 : 1}
                      value={item[column.key] ?? ""}
                      onChange={(e) =>
                        setCollectionDraft((draft) => {
                          const next = [...(draft[collection.id] ?? collection.items)];
                          next[index] = { ...next[index], [column.key]: e.target.value };
                          return { ...draft, [collection.id]: next };
                        })
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="text-cta"
                  onClick={() =>
                    setCollectionDraft((draft) => {
                      const next = [...(draft[collection.id] ?? collection.items)];
                      next.splice(index, 1);
                      return { ...draft, [collection.id]: next };
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="admin-content-group-actions">
              <button
                type="button"
                className="text-cta"
                onClick={() =>
                  setCollectionDraft((draft) => {
                    const next = [...(draft[collection.id] ?? collection.items)];
                    const blank: Record<string, string> = {};
                    for (const column of collection.columns) blank[column.key] = "";
                    next.push(blank);
                    return { ...draft, [collection.id]: next };
                  })
                }
              >
                Add item
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={saveCollection.isPending}
                onClick={() => saveCollection.mutate({ id: collection.id, items })}
              >
                Save {collection.label}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
