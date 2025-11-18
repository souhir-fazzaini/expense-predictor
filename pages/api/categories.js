import pool from "../../lib/db";

export default async function handler(req, res) {
    if (req.method === "GET") {
        try {
            // Récupérer toutes les catégories
            const [rows] = await pool.query("SELECT id, name FROM categories ORDER BY name ASC");
            res.status(200).json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error fetching categories" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
