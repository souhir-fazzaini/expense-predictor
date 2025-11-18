import { useState, useEffect } from "react";
import styles from "./AddExpense.module.css"; // CSS existant

export default function AddExpense() {
    const [expense, setExpense] = useState({
        title: "",
        amount: "",
        category_id: "", // stocke l'id de la catégorie
    });

    const [categories, setCategories] = useState([]); // ⚡ ici, initialisation vide

    // 🔹 Charger les catégories depuis l'API
    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExpense((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(expense),
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Added: ${expense.title} - ${expense.amount} USD`);
                setExpense({ title: "", amount: "", category_id: "" });
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error adding expense");
        }
    };

    return (
        <div className={styles.addExpenseContainer}>
            <nav className={styles.navbar}>
                <h1>Add Expense</h1>
            </nav>

            <main className={styles.main}>
                <div className={styles.welcomeCard}>
                    <h2>Add a new expense</h2>
                    <form onSubmit={handleAddExpense} className={styles.form}>
                        <div>
                            <label>Title:</label>
                            <input
                                type="text"
                                name="title"
                                value={expense.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label>Amount:</label>
                            <input
                                type="number"
                                name="amount"
                                value={expense.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label>Category:</label>
                            <select
                                name="category_id"
                                value={expense.category_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit">Add Expense</button>
                    </form>
                </div>
            </main>
        </div>
    );
}
