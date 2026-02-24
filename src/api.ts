// ============================================================
// Pinterest API v5 — Typed HTTP Client
// ============================================================

import { getValidAccessToken } from "./auth.js";
import type {
  Board,
  BoardSection,
  CreatePinRequest,
  PaginatedResponse,
  Pin,
  PinUpdate,
  PinterestApiError,
  UserAccount,
} from "./types.js";

const API_BASE = "https://api.pinterest.com/v5";

// --------------- Core Request ---------------

async function pinterestRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): Promise<T> {
  const token = await getValidAccessToken();

  const url = new URL(`${API_BASE}${path}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  console.error(`[api] ${method} ${url.pathname}${url.search}`);

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = (await response.json()) as PinterestApiError;
      errorMessage = `Pinterest API error ${response.status}: ${errorData.message} (code: ${errorData.code})`;
    } catch {
      errorMessage = `Pinterest API error ${response.status}: ${await response.text()}`;
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

// --------------- Paginated Request ---------------

async function paginatedRequest<T>(
  path: string,
  queryParams?: Record<string, string>,
  pageSize?: number,
  bookmark?: string,
): Promise<PaginatedResponse<T>> {
  const params: Record<string, string> = { ...queryParams };
  if (pageSize) params.page_size = String(pageSize);
  if (bookmark) params.bookmark = bookmark;

  return pinterestRequest<PaginatedResponse<T>>("GET", path, undefined, params);
}

// --------------- Boards ---------------

export async function listBoards(
  pageSize?: number,
  bookmark?: string,
): Promise<PaginatedResponse<Board>> {
  return paginatedRequest<Board>("/boards", undefined, pageSize, bookmark);
}

export async function createBoard(
  name: string,
  description?: string,
  privacy?: string,
): Promise<Board> {
  const body: Record<string, unknown> = { name };
  if (description) body.description = description;
  if (privacy) body.privacy = privacy;
  return pinterestRequest<Board>("POST", "/boards", body);
}

export async function listBoardSections(
  boardId: string,
  pageSize?: number,
  bookmark?: string,
): Promise<PaginatedResponse<BoardSection>> {
  return paginatedRequest<BoardSection>(
    `/boards/${boardId}/sections`,
    undefined,
    pageSize,
    bookmark,
  );
}

export async function createBoardSection(
  boardId: string,
  name: string,
): Promise<BoardSection> {
  return pinterestRequest<BoardSection>("POST", `/boards/${boardId}/sections`, { name });
}

// --------------- Pins ---------------

export async function listBoardPins(
  boardId: string,
  pageSize?: number,
  bookmark?: string,
): Promise<PaginatedResponse<Pin>> {
  return paginatedRequest<Pin>(`/boards/${boardId}/pins`, undefined, pageSize, bookmark);
}

export async function listSectionPins(
  boardId: string,
  sectionId: string,
  pageSize?: number,
  bookmark?: string,
): Promise<PaginatedResponse<Pin>> {
  return paginatedRequest<Pin>(
    `/boards/${boardId}/sections/${sectionId}/pins`,
    undefined,
    pageSize,
    bookmark,
  );
}

export async function getPin(pinId: string): Promise<Pin> {
  return pinterestRequest<Pin>("GET", `/pins/${pinId}`);
}

export async function updatePin(pinId: string, update: PinUpdate): Promise<Pin> {
  return pinterestRequest<Pin>("PATCH", `/pins/${pinId}`, update as Record<string, unknown>);
}

export async function createPin(data: CreatePinRequest): Promise<Pin> {
  return pinterestRequest<Pin>("POST", "/pins", data as unknown as Record<string, unknown>);
}

// --------------- Search ---------------

export async function searchPins(
  query: string,
  bookmark?: string,
): Promise<PaginatedResponse<Pin>> {
  const params: Record<string, string> = { query };
  if (bookmark) params.bookmark = bookmark;
  return paginatedRequest<Pin>("/search/pins", params);
}

// --------------- User ---------------

export async function getUserAccount(): Promise<UserAccount> {
  return pinterestRequest<UserAccount>("GET", "/user_account");
}

// --------------- Image Fetcher ---------------

/**
 * Fetches an image from a URL and returns it as base64.
 * This fetches from Pinterest's CDN — no auth header needed.
 */
export async function fetchImageAsBase64(
  imageUrl: string,
): Promise<{ data: string; mimeType: string }> {
  console.error(`[api] Fetching image: ${imageUrl}`);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${imageUrl}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  console.error(`[api] Image fetched: ${contentType}, ${Math.round(arrayBuffer.byteLength / 1024)}KB`);

  return { data: base64, mimeType: contentType };
}
