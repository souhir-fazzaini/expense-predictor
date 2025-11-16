import React, {useEffect} from "react";
import { useRouter } from "next/router";
import styles from './Dashboard.module.css';
import Chart from "chart.js/auto";

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        const ctx = document.getElementById("categoryChart");

        new Chart(ctx, {
            type: "pie",
            data: {
                labels: ["Food", "Transport", "Shopping", "Bills", "Other"],
                datasets: [
                    {
                        data: [250, 120, 300, 180, 90],
                        backgroundColor: [
                            "#4F46E5",
                            "#10B981",
                            "#F59E0B",
                            "#EF4444",
                            "#6B7280",
                        ],
                    },
                ],
            },
        });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    const handleAddExpense = () => {
        // Rediriger vers la page d'ajout de dépense
        router.push("/add-expense");
        // Ou ouvrir un modal pour ajouter une dépense
        // setIsAddExpenseModalOpen(true);
    };

    return (
        <div className={styles.dashboard}>
            <nav className={styles.navbar}>
                <h1>Expense Predictor</h1>
                <div className={styles.navButtons}>
                    <button onClick={handleAddExpense} className={styles.logoutButton}   style={{ marginRight: '10px' }}>
                        Add expense
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.welcomeCard}>
                    <h2>Your Dashboard Overview</h2>
                    <p>Track and analyze your monthly expenses easily.</p>

                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <h3>Total Expenses</h3>
                            <p>$2,450 this month</p>
                        </div>

                        <div className={styles.statCard}>
                            <h3>Predicted Spending</h3>
                            <p>Estimated: $2,900</p>
                        </div>

                        <div className={styles.statCard}>
                            <h3>Categories</h3>
                            <canvas id="categoryChart" width="200" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
