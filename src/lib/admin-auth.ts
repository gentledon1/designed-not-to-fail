/**
 * Admin Authentication Service
 *
 * Provides secure admin authentication using:
 * - First-time login sets the admin password (SHA-256 hash stored in DB)
 * - Server-side session tokens stored in database
 * - 24-hour session duration
 *
 * SECURITY NOTES:
 * - Password is hashed using SHA-256 before storage
 * - Session tokens are cryptographically random and time-limited (24h)
 * - Password hash is stored in admin_session table with special user_id "__password_hash__"
 *
 * SETUP:
 * - First login attempt will set the admin password
 * - Use resetAdminPassword() to clear the stored hash and set a new password
 */

import { AdminSessionORM } from "@/sdk/database/orm/orm_admin_session";

// Session configuration
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_TOKEN_KEY = "admin_session_token";
const PASSWORD_HASH_USER_ID = "__password_hash__";

/**
 * Generate a cryptographically secure random token
 */
function generateSessionToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		""
	);
}

/**
 * Hash a password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Get the stored password hash from the database
 */
async function getStoredPasswordHash(): Promise<string | null> {
	try {
		const orm = AdminSessionORM.getInstance();
		const sessions = await orm.getAdminSessionByUserId(PASSWORD_HASH_USER_ID);
		if (sessions.length > 0) {
			return sessions[0].session_token; // We store the hash in session_token field
		}
		return null;
	} catch (error) {
		console.error("Failed to get stored password hash:", error);
		return null;
	}
}

/**
 * Store the password hash in the database
 */
async function storePasswordHash(hash: string): Promise<boolean> {
	try {
		const orm = AdminSessionORM.getInstance();

		// Delete any existing password hash record
		const existing = await orm.getAdminSessionByUserId(PASSWORD_HASH_USER_ID);
		for (const session of existing) {
			await orm.deleteAdminSessionById(session.id);
		}

		// Store the new password hash
		await orm.insertAdminSession([
			{
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
				session_token: hash, // Store hash in session_token field
				expires_at: "0", // Password hash never expires
				user_id: PASSWORD_HASH_USER_ID,
			},
		]);

		return true;
	} catch (error) {
		console.error("Failed to store password hash:", error);
		return false;
	}
}

/**
 * Check if admin password has been set
 */
export async function isPasswordSet(): Promise<boolean> {
	const hash = await getStoredPasswordHash();
	return hash !== null;
}

/**
 * Reset admin password - clears the stored hash
 * Next login will set a new password
 */
export async function resetAdminPassword(): Promise<boolean> {
	try {
		const orm = AdminSessionORM.getInstance();

		// Delete the password hash record
		const existing = await orm.getAdminSessionByUserId(PASSWORD_HASH_USER_ID);
		for (const session of existing) {
			await orm.deleteAdminSessionById(session.id);
		}

		// Also logout any existing sessions
		await logoutAdmin();

		return true;
	} catch (error) {
		console.error("Failed to reset admin password:", error);
		return false;
	}
}

/**
 * Authenticate admin with password
 * Returns session token on success, null on failure
 *
 * Authentication flow:
 * 1. If no password hash exists, this is first-time setup - set the password
 * 2. If password hash exists, validate against it
 * 3. If valid, create a new session token and store in database
 * 4. Store session token in localStorage for client-side persistence
 */
export async function authenticateAdmin(
	password: string
): Promise<string | null> {
	if (!password || password.trim() === "") {
		return null;
	}

	const passwordHash = await hashPassword(password);
	const storedHash = await getStoredPasswordHash();

	// First-time setup: store the password hash
	if (storedHash === null) {
		const stored = await storePasswordHash(passwordHash);
		if (!stored) {
			return null;
		}
	} else {
		// Validate against stored hash
		if (passwordHash !== storedHash) {
			return null;
		}
	}

	// Password is valid (or just set), create a new session
	const sessionToken = generateSessionToken();
	const expiresAt = Math.floor(
		(Date.now() + SESSION_DURATION_MS) / 1000
	).toString();

	try {
		const orm = AdminSessionORM.getInstance();

		// Clean up any existing admin sessions (not password hash)
		const existingSessions = await orm.getAllAdminSession();
		for (const session of existingSessions) {
			if (session.user_id !== PASSWORD_HASH_USER_ID) {
				await orm.deleteAdminSessionById(session.id);
			}
		}

		// Create new session
		await orm.insertAdminSession([
			{
				id: "",
				data_creator: "",
				data_updater: "",
				create_time: "",
				update_time: "",
				session_token: sessionToken,
				expires_at: expiresAt,
				user_id: "admin",
			},
		]);

		// Store token in localStorage
		localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);

		return sessionToken;
	} catch (error) {
		console.error("Failed to create admin session:", error);
		return null;
	}
}

/**
 * Validate an existing session token
 * Returns true if session is valid and not expired
 */
export async function validateSession(
	sessionToken?: string
): Promise<boolean> {
	const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);

	if (!token) {
		return false;
	}

	try {
		const orm = AdminSessionORM.getInstance();
		const sessions = await orm.getAdminSessionBySessionToken(token);

		if (sessions.length === 0) {
			// Session not found, clear local storage
			localStorage.removeItem(SESSION_TOKEN_KEY);
			return false;
		}

		const session = sessions[0];

		// Skip password hash records
		if (session.user_id === PASSWORD_HASH_USER_ID) {
			localStorage.removeItem(SESSION_TOKEN_KEY);
			return false;
		}

		const now = Math.floor(Date.now() / 1000);
		const expiresAt = parseInt(session.expires_at, 10);

		if (now > expiresAt) {
			// Session expired, clean up
			await orm.deleteAdminSessionById(session.id);
			localStorage.removeItem(SESSION_TOKEN_KEY);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Session validation failed:", error);
		return false;
	}
}

/**
 * Get the current session token from localStorage
 */
export function getSessionToken(): string | null {
	return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Logout - invalidate current session
 */
export async function logoutAdmin(): Promise<void> {
	const token = localStorage.getItem(SESSION_TOKEN_KEY);

	if (token) {
		try {
			const orm = AdminSessionORM.getInstance();
			await orm.deleteAdminSessionBySessionToken(token);
		} catch (error) {
			console.error("Failed to delete session:", error);
		}
	}

	localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Clean up expired sessions (maintenance function)
 */
export async function cleanupExpiredSessions(): Promise<void> {
	try {
		const orm = AdminSessionORM.getInstance();
		const allSessions = await orm.getAllAdminSession();
		const now = Math.floor(Date.now() / 1000);

		for (const session of allSessions) {
			// Don't delete password hash records
			if (session.user_id === PASSWORD_HASH_USER_ID) {
				continue;
			}

			const expiresAt = parseInt(session.expires_at, 10);
			if (now > expiresAt) {
				await orm.deleteAdminSessionById(session.id);
			}
		}
	} catch (error) {
		console.error("Failed to cleanup expired sessions:", error);
	}
}

/**
 * React hook-friendly admin auth state
 */
export interface AdminAuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}
