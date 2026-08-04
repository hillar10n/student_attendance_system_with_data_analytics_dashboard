import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { api, ApiError } from "../api/client";
import type { AuthUser } from "../types";

interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get<{ user: AuthUser }>("/auth/me.php")
			.then((res) => setUser(res.user))
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	async function login(email: string, password: string) {
		const res = await api.post<{ user: AuthUser }>("/auth/login.php", {
			email,
			password,
		});
		setUser(res.user);
	}

	async function logout() {
		try {
			await api.post("/auth/logout.php");
		} catch {
			/* proceed with client-side logout regardless */
		}
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}

export { ApiError };
