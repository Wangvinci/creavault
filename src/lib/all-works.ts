"use client";

import { Content, mockContent } from "./mock-content";
import { listLocalWorks, useLocalStore } from "./works-store";

/** Hook returning mock + local works merged, newest first. */
export function useAllWorks(): Content[] {
  return useLocalStore<Content[]>(() => {
    const local = listLocalWorks();
    return [...local, ...mockContent];
  });
}

/** Find a work by id from either store (client-only). */
export function findWork(id: string): Content | undefined {
  return [...listLocalWorks(), ...mockContent].find((w) => w.id === id);
}
