// lib/db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // ton mot de passe MySQL
    database: 'expense_prediction',
    port: 3307, // ou 3306 selon ton MySQL
});

export default pool;
