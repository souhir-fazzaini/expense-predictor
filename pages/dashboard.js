import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import styles from './Dashboard.module.css';
import Chart from "chart.js/auto";

export default function Dashboard() {
    const router = useRouter();
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [prediction, setPrediction] = useState("Loading...");
    const [chartInstance, setChartInstance] = useState(null);

    // 🔮 Fonction de prédiction - STABLE avec useCallback
    const fetchPrediction = useCallback(async () => {
        try {
            console.log("🔄 Calling single value prediction API...");

            const res = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expenses: [
                        { title: "Food", amount: 250 },
                        { title: "Transport", amount: 120 },
                        { title: "Shopping", amount: 300 },
                        { title: "Bills", amount: 180 },
                        { title: "Other", amount: 90 },
                    ]
                }),
            });

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }

            const data = await res.json();
            console.log("✅ Single value prediction result:", data);

            // Afficher juste la valeur prédite
            if (data.prediction && data.prediction.predictedTotal) {
                const predictionValue = data.prediction.predictedTotal;
                setPrediction(`Next month: $${predictionValue}`);
            } else if (data.predictedAmount) {
                setPrediction(`Estimated: $${data.predictedAmount}`);
            } else if (data.message) {
                setPrediction(data.message);
            } else {
                setPrediction("Prediction complete");
            }

            return data;
        } catch (error) {
            console.error("❌ Prediction error:", error);
            setPrediction("Error loading prediction");
            return null;
        }
    }, []);// ✅ Aucune dépendance = fonction stable // ✅ Aucune dépendance = fonction stable

    // Initialisation du graphique - STABLE
    const initializeChart = useCallback(() => {
        const ctx = document.getElementById("categoryChart");
        if (!ctx) {
            console.log("❌ Chart canvas not found");
            return null;
        }

        // Détruire l'instance précédente si elle existe
        if (chartInstance) {
            console.log("🗑️ Destroying previous chart instance");
            chartInstance.destroy();
        }

        try {
            const newChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: ["Food", "Transport", "Shopping", "Bills", "Other"],
                    datasets: [
                        {
                            data: [250, 120, 300, 180, 90],
                            backgroundColor: ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6B7280"],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                    },
                },
            });

            setChartInstance(newChart);
            console.log("✅ Chart initialized successfully");
            return newChart;
        } catch (error) {
            console.error("❌ Chart initialization error:", error);
            return null;
        }
    }, [chartInstance]); // ✅ Dépend seulement de chartInstance

    // 🔥 CORRECTION : useEffect avec les bonnes dépendances
    useEffect(() => {
        console.log("🚀 Dashboard useEffect running");

        let isMounted = true;

        // Fonction asynchrone pour charger les données
        const loadData = async () => {
            try {
                console.log("📊 Loading dashboard data...");

                // 1️⃣ Récupérer total des dépenses
                const expensesResponse = await fetch("/api/expenses");
                if (!expensesResponse.ok) throw new Error("Failed to fetch expenses");

                const expensesData = await expensesResponse.json();
                if (isMounted) {
                    setTotalExpenses(expensesData.total || 0);
                }

                // 2️⃣ Prédiction (UNE SEULE FOIS)
                const predictionResult = await fetchPrediction();
                console.log("🎯 Prediction completed:", predictionResult);

                // 3️⃣ Initialiser le graphique (UNE SEULE FOIS)
                if (isMounted) {
                    initializeChart();
                }

            } catch (error) {
                console.error("❌ Error loading dashboard data:", error);
                if (isMounted) {
                    setPrediction("Error loading data");
                }
            }
        };

        loadData();

        // Cleanup function
        return () => {
            console.log("🧹 Cleaning up dashboard...");
            isMounted = false;
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    }, []); // ✅ DÉPENDANCES VIDES = exécute UNE SEULE FOIS

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    const handleAddExpense = () => {
        router.push("/add-expense");
    };

    return (
        <div className={styles.dashboard}>
            <nav className={styles.navbar}>
                <h1>Expense Predictor</h1>
                <div className={styles.navButtons}>
                    <button onClick={handleAddExpense} className={styles.logoutButton} style={{ marginRight: '10px' }}>
                        Add expense
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.welcomeCard}>
                    <h2>Your Dashboard Overview</h2>
                    <p>Track and analyze your monthly expenses easily.</p>

                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <h3>Total Expenses</h3>
                            <p>${totalExpenses} this month</p>
                        </div>

                        <div className={styles.statCard}>
                            <h3>Predicted Spending</h3>
                            <p>Estimated: {prediction}</p>
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
