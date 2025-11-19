// pages/api/predict.js - VERSION PRÉDICTION VALEUR UNIQUE
export default async function handler(req, res) {
    console.log('🔍 === OLLAMA PREDICT API CALLED ===');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Handle expenses data prediction with Ollama
        if (req.body.expenses && Array.isArray(req.body.expenses)) {
            console.log('📊 Predicting single total value with Ollama...');

            // Utiliser Ollama pour prédire une seule valeur totale
            const prediction = await getOllamaSingleValuePrediction(req.body.expenses);

            return res.status(200).json({
                success: true,
                prediction: prediction,
                message: "AI-powered total expense prediction"
            });
        }

        // Handle normal description-based prediction
        const description = req.body.description || '';
        if (!description.trim()) {
            return res.status(400).json({
                error: 'Description is required for prediction'
            });
        }

        const prediction = await getOllamaDescriptionPrediction(description.trim());
        return res.status(200).json(prediction);

    } catch (error) {
        console.error('💥 Ollama prediction error:', error);
        return res.status(500).json({
            error: 'Failed to get AI prediction',
            details: error.message
        });
    }
}

// 🔮 Fonction principale pour la prédiction d'une SEULE VALEUR
async function getOllamaSingleValuePrediction(expenses) {
    console.log('🤖 Calling Ollama for single value prediction...');

    const expensesSummary = expenses.map(exp =>
        `${exp.title}: $${exp.amount}`
    ).join(', ');

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averagePerCategory = total / expenses.length;

    const prompt = `
    You are a financial AI expert. Analyze this monthly expense data and predict the TOTAL amount for next month.

    CURRENT EXPENSES:
    ${expensesSummary}
    Current Total: $${total}
    Average per category: $${Math.round(averagePerCategory)}

    Based on spending patterns and trends, predict the total amount for next month.

    Return ONLY a single number representing the predicted total for next month.

    Example: 850
    Another example: 920

    Important: 
    - Return ONLY the number, no other text
    - No JSON, no explanations, just the number
    - The number should be realistic based on current spending
    `;

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistral', // ou 'llama2'
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1, // Très déterministe
                }
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        console.log('📊 Ollama single value response:', ollamaData);

        // Extraire juste le nombre de la réponse
        const numberMatch = ollamaData.response.match(/\d+/);
        if (numberMatch) {
            const predictedValue = parseInt(numberMatch[0]);

            return {
                predictedTotal: predictedValue,
                currentTotal: total,
                difference: predictedValue - total,
                percentageChange: Math.round(((predictedValue - total) / total) * 100)
            };
        } else {
            throw new Error('No number found in Ollama response');
        }

    } catch (error) {
        console.error('❌ Ollama connection failed, using fallback:', error);
        // Fallback si Ollama n'est pas disponible
        return getFallbackSingleValuePrediction(expenses);
    }
}

// 🛡️ Fallback pour prédiction valeur unique
function getFallbackSingleValuePrediction(expenses) {
    console.log('🛡️ Using fallback single value prediction');

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Variation réaliste : -10% à +15%
    const variation = 0.9 + (Math.random() * 0.25);
    const predictedTotal = Math.round(total * variation);

    return {
        predictedTotal: predictedTotal,
        currentTotal: total,
        difference: predictedTotal - total,
        percentageChange: Math.round(((predictedTotal - total) / total) * 100)
    };
}

// 🔮 Prédiction basée sur description avec Ollama
async function getOllamaDescriptionPrediction(description) {
    const prompt = `
    Analyze this expense description and predict the most likely amount.

    Expense description: "${description}"

    Return ONLY a single number representing the predicted amount.

    Example: 45
    Another example: 120

    Important: Return ONLY the number, no other text.
    `;

    try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistral',
                prompt: prompt,
                stream: false,
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        const numberMatch = ollamaData.response.match(/\d+/);

        if (numberMatch) {
            const amount = parseInt(numberMatch[0]);
            return {
                predictedAmount: amount,
                description: description
            };
        } else {
            throw new Error('No number found in Ollama response');
        }

    } catch (error) {
        console.error('Ollama failed, using mock prediction:', error);
        return getMockSingleValuePrediction(description);
    }
}

// 🎯 Fonction mock pour valeur unique
function getMockSingleValuePrediction(description) {
    const desc = description.toLowerCase();
    let amount = 25 + (description.length % 50);

    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('grocery') || desc.includes('cafe') || desc.includes('meal')) {
        amount = 15 + (description.length % 35);
    } else if (desc.includes('bus') || desc.includes('train') || desc.includes('taxi') || desc.includes('transport') || desc.includes('fuel') || desc.includes('gas')) {
        amount = 20 + (description.length % 40);
    } else if (desc.includes('electric') || desc.includes('water') || desc.includes('internet') || desc.includes('phone') || desc.includes('bill')) {
        amount = 50 + (description.length % 100);
    } else if (desc.includes('movie') || desc.includes('game') || desc.includes('entertainment') || desc.includes('netflix') || desc.includes('spotify')) {
        amount = 10 + (description.length % 30);
    } else if (desc.includes('doctor') || desc.includes('medical') || desc.includes('pharmacy') || desc.includes('hospital')) {
        amount = 30 + (description.length % 70);
    } else if (desc.includes('shop') || desc.includes('store') || desc.includes('market') || desc.includes('mall') || desc.includes('clothing')) {
        amount = 25 + (description.length % 60);
    }

    return {
        predictedAmount: parseFloat(amount.toFixed(2)),
        description: description
    };
}
