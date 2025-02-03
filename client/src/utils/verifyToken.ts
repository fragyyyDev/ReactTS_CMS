export default async function verifyToken(token: string): Promise<boolean> {
    if (!token) return false;
    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/verify-token`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Pokud např. server vrátí 401, token není platný
            console.error('Token verification failed:', await response.text());
            return false;
        }

        return true;
    } catch (e) {
        console.error('Error during token verification:', e);
        return false;
    }
}
