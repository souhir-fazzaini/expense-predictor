import mysql from 'mysql2/promise';

// Connexion à MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // ton mot de passe MySQL
    database: 'expense_prediction',
    port: 3307, // ou 3306 selon ton MySQL
});

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { title, amount, category_id } = req.body; // inclure user_id
        const user_id = 1; // valeur fixe pour tester

        try {
            const [result] = await pool.query(
                "INSERT INTO expenses (description, amount, category_id, user_id) VALUES (?, ?, ?, ?)",
                [title, amount, category_id, user_id]
            );
            res.status(200).json({ message: "Expense added", id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error adding expense", error });
        }
    } else  if (req.method === "GET") {
        try {
            // Calculer la somme totale de toutes les dépenses
            const [rows] = await pool.query("SELECT SUM(amount) AS total FROM expenses");
            const total = rows[0].total || 0; // si aucune dépense, total = 0
            res.status(200).json({ total });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error fetching total expenses" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}

