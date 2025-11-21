import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import styles from './Dashboard.module.css';
import Chart from "chart.js/auto";

export default function Dashboard() {
    const router = useRouter();
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [prediction, setPrediction] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [expensesList, setExpensesList] = useState([]);
    const chartInstanceRef = useRef(null);
    const chartInitializedRef = useRef(false);

    // Fonction de prédiction
    const fetchPrediction = async (expenses) => {
        try {
            console.log("🔄 Calling prediction API with expenses:", expenses);

            const res = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ expenses: expenses, months: 1 }),
            });



            const data = await res.json();
            console.log("✅ Prediction API response:", data);

            if (data.prediction !== undefined) {
                setPrediction(`Next month: $${data.prediction}`);
            } else if (data.predictedTotal !== undefined) {
                setPrediction(`Next month: $${data.predictedTotal}`);
            } else {
                const fallbackPrediction = expenses * 1.1;
                setPrediction(`Next month: $${Math.round(fallbackPrediction)}`);
            }

            return data;
        } catch (error) {
            console.error("❌ Prediction error:", error);
            const fallbackPrediction = expenses * 1.1;
            setPrediction(`Estimated: $${Math.round(fallbackPrediction)} (fallback)`);
            return null;
        }
    };

    // Initialisation du graphique - CORRIGÉE
     const initializeChart = (expenseList = []) => {
        console.log("expenselist", expenseList)
        setTimeout(async () => {
            const ctx = document.getElementById("categoryChart");
            if (!ctx) {
                console.log("❌ Chart canvas not found, retrying...");
                setTimeout(() => initializeChart(expenseList), 100);
                return;
            }

            // Détruire l'instance précédente
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            try {
                // Préparer les données
                let labels, data;

                if (expenseList && expenseList.length > 0) {
                    const categoryTotals = {};

                    // Récupérer les catégories depuis l'API
                    const categoriesResponse = await fetch('/api/categories');
                    const categories = await categoriesResponse.json();

                    console.log("category", categories)
                    const categoryMap = {};
                    categories.forEach(cat => {
                        categoryMap[cat.id] = cat.name;
                    });
                    expenseList.forEach((expense) => {
                        // Utiliser category_id pour trouver le nom de la catégorie
                        const categoryName = expense.category_id ?
                            categoryMap[expense.category_id] : 'Other';

                        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (expense.amount || 0);
                    });

                    labels = Object.keys(categoryTotals);
                    data = Object.values(categoryTotals);
                } else {
                    // Données par défaut plus réalistes
                    labels = ["Food 🍕", "Transport 🚗", "Shopping 🛍️", "Bills 💡", "Entertainment 🎬"];
                    data = [350, 150, 200, 180, 120];
                }

                console.log("📊 Chart data:", {labels, data});

                const newChart = new Chart(ctx, {
                    type: "doughnut",
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                data: data,
                                backgroundColor: [
                                    "#4F46E5", "#10B981", "#F59E0B",
                                    "#EF4444", "#6B7280", "#8B5CF6",
                                    "#06B6D4", "#84CC16", "#F97316"
                                ],
                                borderColor: "#ffffff",
                                borderWidth: 3,
                                hoverOffset: 20
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12,
                                        family: "'Inter', sans-serif"
                                    },
                                    color: '#374151'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                callbacks: {
                                    label: function (context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: $${value} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '60%',
                        animation: {
                            animateScale: true,
                            animateRotate: true
                        }
                    },
                });

                chartInstanceRef.current = newChart;
                chartInitializedRef.current = true;
                console.log("✅ Chart initialized successfully with", data.length, "categories");

            } catch (error) {
                console.error("❌ Chart initialization error:", error);
            }
        }, 100);
    };

    // Chargement des données
    useEffect(() => {
        console.log("🚀 Dashboard useEffect running");

        let isMounted = true;

        const loadData = async () => {
            try {
                setLoading(true);

                // 1. Récupérer les dépenses
                let expensesData = { total: 0, expenses: [] };
                try {
                    const expensesResponse = await fetch("/api/expenses");
                    if (expensesResponse.ok) {
                        expensesData = await expensesResponse.json();
                        console.log("📊 Expenses data loaded:", expensesData);
                    }
                } catch (error) {
                    console.error("❌ Expenses API error:", error);
                }

                const currentTotal = expensesData.total || 0;
                const expensesArray = expensesData.expenses || [];

                if (isMounted) {
                    setTotalExpenses(currentTotal);
                    setExpensesList(expensesArray);
                }

                console.log("expenseresponse",expensesArray)
                await fetchPrediction(currentTotal);

                // 3. Graphique - attendre un peu pour que le DOM soit prêt
                setTimeout(() => {
                    if (isMounted) {
                        initializeChart(expensesArray);
                    }
                }, 200);

            } catch (error) {
                console.error("❌ Error loading dashboard:", error);
                if (isMounted) {
                    setPrediction("Error loading data");
                    setTimeout(() => initializeChart(), 200);
                }
            } finally {
                if (isMounted) {
                    setTimeout(() => setLoading(false), 300);
                }
            }
        };

        loadData();

        return () => {
            console.log("🧹 Cleaning up dashboard...");
            isMounted = false;
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    const handleAddExpense = () => {
        router.push("/add-expense");
    };

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <nav className={styles.navbar}>
                    <h1>Expense Predictor</h1>
                    <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </nav>
                <main className={styles.main}>
                    <div className={styles.welcomeCard}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading your dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <nav className={styles.navbar}>
                <h1>Expense Predictor</h1>
                <div className={styles.navButtons}>
                    <button onClick={handleAddExpense} className={styles.logoutButton}>
                        + Add Expense
                    </button>
                    <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.welcomeCard}>
                    <h2>Welcome to Your Dashboard</h2>
                    <p>Track and analyze your monthly expenses easily.</p>

                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <h3>Total Expenses</h3>
                            <p className={styles.amount}>${totalExpenses}</p>
                            <span className={styles.subtitle}>this month</span>
                        </div>

                        <div className={styles.statCard}>
                            <h3>Predicted Spending</h3>
                            <p className={styles.amount}>{prediction}</p>
                            <span className={styles.subtitle}>next month</span>
                        </div>

                        <div className={`${styles.statCard} ${styles.chartCard}`}>
                            <h3>Expense Categories</h3>
                            <div className={styles.chartContainer}>
                                <canvas
                                    id="categoryChart"
                                    width="400"
                                    height="400"
                                ></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
