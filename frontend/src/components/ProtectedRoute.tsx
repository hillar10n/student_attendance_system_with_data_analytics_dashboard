import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export default function ProtectedRoute({
	roles,
	children,
}: {
	roles: Role[];
	children: ReactNode;
}) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center text-ink-400">
				Loading...
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	// Client-side check for navigation/UX only - every API endpoint
	// independently re-checks the role server-side (Section 6.2.1),
	// since a hidden UI element is not real access control.
	if (!roles.includes(user.role)) {
		return <Navigate to={`/${user.role}`} replace />;
	}

	return <>{children}</>;
}
