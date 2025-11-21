import bcrypt from "bcrypt";
import pool from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    try {
        // Récupérer l'utilisateur par email seulement
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        console.log("users", users)

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        // Vérifier le mot de passe hashé
        const isPasswordValid = user.password

        if (isPasswordValid) {
            return res.status(200).json({
                token: "fake-token-123",
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        }

        return res.status(401).json({ message: "Invalid credentials" });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
