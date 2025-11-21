// pages/api/predict.js - VERSION CORRIGÉE
export default async function handler(req, res) {
    console.log('🔍 === OLLAMA PREDICT API CALLED ===');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("hh",req.body.expenses)
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
    console.log(expenses)

    const total = expenses;
    console.log(total);
    const averagePerCategory = total / expenses.length;

    const prompt = `
PRÉDICTION BUDGÉTAIRE - ÉCHELLE RÉELLE

🚨 ATTENTION : BUDGET TRÈS FAIBLE
• Budget actuel total : SEULEMENT $${total}
• C'est un très petit budget quotidien
• Échelle réelle : quelques dollars seulement

📋 DÉTAIL RÉEL DES DÉPENSES :
${expenses.map((exp, index) => {
        return `${index + 1}. ${exp.category} : $${exp.amount.toFixed(2)}`;
    }).join('\n')}

🎯 CONTRAINTES STRICTES :
• ÉCHELLE : $5 à $15 maximum
• Budget actuel : $${total} 
• Prédiction entre : $${(Math.min(total * 1.5, 15)).toFixed(1)} et $${(Math.min(total * 2.0, 20)).toFixed(1)}
• Petites variations seulement

💰 EXEMPLES RÉALISTES pour $${total} :
• ${(total + 0.5).toFixed(1)} (petite augmentation)
• ${(total + 1.0).toFixed(1)} (dépense supplémentaire)
• ${(total - 0.3).toFixed(1)} (légère économie)
• ${(total * 1.1).toFixed(1)} (hausse de 10%)

⚡ INSTRUCTION :
PRÉDIRE UN TRÈS PETIT MONTANT - MAXIMUM $20
Un seul nombre avec 1 décimale

Prédiction :`;

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
                options: {
                    temperature: 0.1,
                }
            }),
        });

        if (!ollamaResponse.ok) {
            throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        console.log('📊 Ollama raw response:', ollamaData.response);

        // CORRECTION : Meilleure extraction des nombres avec décimales
        const numberMatch = ollamaData.response.match(/\d+\.?\d*/);
        if (numberMatch) {
            const predictedValue = parseFloat(numberMatch[0]);

            // VALIDATION : Vérifier que la prédiction est réaliste
            const realisticMin = total * 0.5;  // -50%
            const realisticMax = total * 1.5;  // +50%

            let finalPrediction = predictedValue;

            // Si la prédiction est complètement irréaliste, utiliser le fallback
            if (predictedValue < realisticMin || predictedValue > realisticMax) {
                console.warn('⚠️ Ollama prediction unrealistic, using fallback');
                return getFallbackSingleValuePrediction(expenses);
            }

            console.log(`✅ Prediction: $${total} → $${finalPrediction}`);

            return {
                predictedTotal: parseFloat(finalPrediction.toFixed(2)),
                currentTotal: parseFloat(total.toFixed(2)),
                difference: parseFloat((finalPrediction - total).toFixed(2)),
                percentageChange: parseFloat((((finalPrediction - total) / total) * 100).toFixed(1))
            };
        } else {
            console.warn('❌ No valid number found in Ollama response, using fallback');
            throw new Error('No valid number found in Ollama response');
        }

    } catch (error) {
        console.error('❌ Ollama connection failed, using fallback:', error);
        return getFallbackSingleValuePrediction(expenses);
    }
}

// 🛡️ Fallback amélioré pour prédiction valeur unique
function getFallbackSingleValuePrediction(expenses) {
    console.log('🛡️ Using improved fallback single value prediction');

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Variation plus réaliste basée sur le type de dépenses
    let variationRange;

    if (total < 100) {
        // Petits budgets : variation plus grande en pourcentage
        variationRange = { min: 0.7, max: 1.4 }; // -30% à +40%
    } else if (total < 500) {
        // Budgets moyens : variation modérée
        variationRange = { min: 0.8, max: 1.3 }; // -20% à +30%
    } else {
        // Gros budgets : variation plus stable
        variationRange = { min: 0.9, max: 1.2 }; // -10% à +20%
    }

    const variation = variationRange.min + (Math.random() * (variationRange.max - variationRange.min));
    const predictedTotal = total * variation;

    console.log(`🛡️ Fallback: $${total} → $${predictedTotal.toFixed(2)} (variation: ${((variation - 1) * 100).toFixed(1)}%)`);

    return {
        predictedTotal: parseFloat(predictedTotal.toFixed(2)),
        currentTotal: parseFloat(total.toFixed(2)),
        difference: parseFloat((predictedTotal - total).toFixed(2)),
        percentageChange: parseFloat((((predictedTotal - total) / total) * 100).toFixed(1))
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
        const numberMatch = ollamaData.response.match(/\d+\.?\d*/);

        if (numberMatch) {
            const amount = parseFloat(numberMatch[0]);
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
