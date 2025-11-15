import React, { useState } from "react";
import styles from './Home.module.css'; // Import as CSS Module

export default function Home() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            alert("Login successful! Token: " + data.token);
            window.location.href = "/dashboard";
        } else {
            alert(data.message);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleLogin} className={styles.form}>
                <h1 className={styles.title}>Welcome Back</h1>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        required
                    />
                </div>

                <button type="submit" className={styles.button}>
                    Login
                </button>

                <p className={styles.forgotPassword}>
                    Forgot password?{" "}
                    <a href="#" className={styles.forgotLink}>
                        Reset here
                    </a>
                </p>
            </form>
        </div>
    );
}
