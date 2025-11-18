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
    } else if (req.method === "GET") {
        try {
            const [rows] = await pool.query("SELECT * FROM expenses ORDER BY created_at DESC");
            res.status(200).json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error fetching expenses" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}

