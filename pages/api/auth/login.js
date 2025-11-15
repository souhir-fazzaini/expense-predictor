export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    // Exemple simple sans base de données
    if (email === "souhirfazzaini@gmail.com" && password === "123456") {
        return res.status(200).json({ token: "fake-token-123" });
    }

    return res.status(401).json({ message: "Invalid credentials" });
}
