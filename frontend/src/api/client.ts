// Thin fetch wrapper. Every call includes credentials so the
// httpOnly session cookie (Section 6.2.1) is sent automatically.
//
// In dev (npm run dev), requests go to '/api/...', which vite.config.ts
// proxies to the local PHP server (127.0.0.1:8000).
//
// In a production build (npm run build), requests default to
// '/sams-api/api/...', matching the README's documented XAMPP folder
// name (htdocs/sams-api/). If you deploy the backend under a different
// folder name, create a `.env` file in `frontend/` containing
// `VITE_API_BASE=/your-folder-name/api` before running the build.
const API_BASE =
	import.meta.env.VITE_API_BASE ||
	(import.meta.env.PROD ? "/sams-api/api" : "/api");

export class ApiError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...(options.headers || {}) },
		...options,
	});

	if (!res.ok) {
		let message = `Request failed (${res.status})`;
		try {
			const body = await res.json();
			if (body?.error) message = body.error;
		} catch {
			/* response wasn't JSON - keep default message */
		}
		throw new ApiError(message, res.status);
	}

	if (res.headers.get("content-type")?.includes("application/json")) {
		return res.json() as Promise<T>;
	}
	return undefined as T;
}

export const api = {
	get: <T>(path: string) => request<T>(path, { method: "GET" }),
	post: <T>(path: string, body?: unknown) =>
		request<T>(path, {
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		}),
};

/** Builds a same-origin download URL (used for <a href> report exports, not fetch). */
export function downloadUrl(path: string): string {
	return `${API_BASE}${path}`;
}
