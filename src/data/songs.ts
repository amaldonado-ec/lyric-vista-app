import { Song } from "@/types/song";
import { defaultSongs } from "@/data/defaultSongs";

const DROPBOX_FILE_URL =
  "https://dl.dropboxusercontent.com/scl/fi/gmglx2bz05cwqy4pzzhsg/songs.json?rlkey=p35ffxkja5o9lpmbz73x98b7n&st=0tts1xya&dl=1";
export const REMOTE_SONGS_URL = DROPBOX_FILE_URL;

const STORAGE_KEY = "lyric-vista-app:songs";
const STORAGE_META_KEY = "lyric-vista-app:songs-meta";
const CACHE_TTL_MS = 15 * 60 * 1000;

const isBrowser = typeof window !== "undefined";

let inMemorySongs: Song[] | null = null;
let syncPromise: Promise<Song[]> | null = null;
let lastChangeCheck = 0;

type SongsMetadata = {
  lastSync: number;
  etag?: string;
  lastModified?: string;
};

const hasNetworkConnection = (): boolean => {
  if (!isBrowser) {
    return true;
  }

  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine !== false;
};

const fallbackTitle = (id: number, index: number) =>
  `Canción ${Number.isFinite(id) ? id : index + 1}`;

const normalizeSongs = (payload: unknown): Song[] | null => {
  if (!Array.isArray(payload)) {
    return null;
  }

  const normalized: Song[] = [];

  payload.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      return;
    }

    const raw = entry as Record<string, unknown>;

    const idCandidate = raw.id;
    const resolvedId = (() => {
      if (typeof idCandidate === "number" && Number.isFinite(idCandidate)) {
        return idCandidate;
      }
      if (typeof idCandidate === "string") {
        const parsed = Number.parseInt(idCandidate, 10);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return index + 1;
    })();

    const title =
      typeof raw.title === "string" && raw.title.trim().length > 0
        ? raw.title
        : fallbackTitle(resolvedId, index);

    const lyrics = typeof raw.lyrics === "string" ? raw.lyrics : "";

    if (!lyrics || lyrics.trim().length === 0) {
      return;
    }

    normalized.push({
      id: resolvedId,
      title,
      lyrics,
    });
  });

  return normalized.length > 0 ? normalized : null;
};

const readCache = (): Song[] | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return normalizeSongs(parsed);
  } catch (error) {
    console.warn("Failed to read songs cache", error);
    return null;
  }
};

const readMetadata = (): SongsMetadata | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_META_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SongsMetadata>;
    if (typeof parsed.lastSync !== "number") {
      return null;
    }

    return {
      lastSync: parsed.lastSync,
      etag: typeof parsed.etag === "string" ? parsed.etag : undefined,
      lastModified:
        typeof parsed.lastModified === "string" ? parsed.lastModified : undefined,
    };
  } catch (error) {
    console.warn("Failed to read songs metadata", error);
    return null;
  }
};

const writeCache = (songs: Song[]) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (error) {
    console.warn("Failed to persist songs cache", error);
  }
};

const writeMetadata = (metadata: SongsMetadata) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("Failed to persist songs metadata", error);
  }
};

const parseRemotePayload = async (response: Response): Promise<Song[]> => {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeSongs(parsed);
    if (!normalized) {
      throw new Error("La lista de canciones remota está vacía o es inválida");
    }
    return normalized;
  } catch (error) {
    throw new Error(
      `No se pudo interpretar el archivo remoto: ${(error as Error).message}`
    );
  }
};

const checkForRemoteChanges = async (metadata: SongsMetadata | null) => {
  try {
    const response = await fetch(REMOTE_SONGS_URL, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    const etag = response.headers.get("etag") ?? undefined;
    const lastModified = response.headers.get("last-modified") ?? undefined;

    if (!metadata) {
      return { needsFetch: true, etag, lastModified, reachable: true } as const;
    }

    if (etag && metadata.etag && etag === metadata.etag) {
      return { needsFetch: false, etag, lastModified, reachable: true } as const;
    }

    if (
      !etag &&
      metadata.lastModified &&
      lastModified &&
      lastModified === metadata.lastModified
    ) {
      return { needsFetch: false, etag, lastModified, reachable: true } as const;
    }

    return { needsFetch: true, etag, lastModified, reachable: true } as const;
  } catch (error) {
    console.warn("Unable to verify remote songs metadata", error);
    return {
      needsFetch: false,
      etag: metadata?.etag,
      lastModified: metadata?.lastModified,
      reachable: false,
    } as const;
  }
};

const resolveInitialSongs = (): Song[] => {
  if (inMemorySongs) {
    return inMemorySongs;
  }

  const cached = readCache();
  inMemorySongs = cached ?? defaultSongs;
  return inMemorySongs;
};

export const getInitialSongs = (): Song[] => {
  return resolveInitialSongs();
};

export const loadSongs = async (): Promise<Song[]> => {
  const initialSongs = resolveInitialSongs();

  if (syncPromise) {
    return syncPromise;
  }

  const now = Date.now();
  const withinCacheWindow = now - lastChangeCheck < CACHE_TTL_MS;

  if (withinCacheWindow) {
    const cached = readCache();
    const reuse = cached ?? initialSongs;
    inMemorySongs = reuse;
    return reuse;
  }

  syncPromise = (async () => {
    const cached = readCache();
    const metadata = readMetadata();
    const timestamp = Date.now();

    if (!hasNetworkConnection()) {
      lastChangeCheck = timestamp;
      const offlineResult = cached ?? initialSongs;
      inMemorySongs = offlineResult;
      return offlineResult;
    }

    const changeCheck = await checkForRemoteChanges(metadata);
    lastChangeCheck = Date.now();

    if (!changeCheck.reachable) {
      const unreachableResult = cached ?? initialSongs;
      inMemorySongs = unreachableResult;
      return unreachableResult;
    }

    if (!changeCheck.needsFetch) {
      const reuse = cached ?? initialSongs;
      writeMetadata({
        lastSync: timestamp,
        etag: changeCheck.etag ?? metadata?.etag,
        lastModified: changeCheck.lastModified ?? metadata?.lastModified,
      });
      inMemorySongs = reuse;
      return reuse;
    }

    try {
      const response = await fetch(REMOTE_SONGS_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const remoteSongs = await parseRemotePayload(response);
      writeCache(remoteSongs);
      writeMetadata({
        lastSync: timestamp,
        etag: response.headers.get("etag") ?? changeCheck.etag,
        lastModified:
          response.headers.get("last-modified") ?? changeCheck.lastModified,
      });
      inMemorySongs = remoteSongs;
      return remoteSongs;
    } catch (error) {
      console.warn("Falling back to cached/default songs", error);
      const fallback = cached ?? initialSongs;
      inMemorySongs = fallback;
      return fallback;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
};

export { defaultSongs };
