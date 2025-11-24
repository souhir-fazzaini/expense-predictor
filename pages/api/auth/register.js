import bcrypt from "bcrypt";
import pool from "../../../lib/db";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }
    console.log("re",req.body)

    const { fullName, email, password, confirmPassword } = req.body;

    try {
        // Validation des champs
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Tous les champs sont requis" });
        }

        // Vérification de la correspondance des mots de passe
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
        }

        // Vérification de la longueur du mot de passe
        if (password.length < 6) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
        }

        // Vérifier si l'email existe déjà
        const [existingUsers] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà" });
        }

        // Hasher le mot de passe
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insérer le nouvel utilisateur dans la base de données
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [fullName, email, hashedPassword]
        );

        // Réponse de succès
        return res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: {
                id: result.insertId,
                name: fullName,
                email: email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}
