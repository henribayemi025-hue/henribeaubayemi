import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize GoogleGenAI server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Route: AI Tutor Chat (Léo, Ada, Néo, Custom)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, tutorName, personality, socraticMode, context, language } = req.body;

    const lang = language === 'en' ? 'English' : 'French';
    const socraticInstruction = socraticMode
      ? `IMPORTANT: You are strictly in SOCRATIC MODE. Do NOT provide direct code answers or solutions. Instead, ask a guiding, thought-provoking question or provide a conceptual hint to help the learner deduce the answer themselves.`
      : `Provide clear, step-by-step guidance, encouraging the learner with concise practical examples when appropriate.`;

    const systemInstruction = `You are ${tutorName || 'Léo'}, an AI mentor for Finjaro Learn (${personality || 'Senior mentor, encouraging, structured and pragmatic'}).
Target language: ${lang}.
Current learning context: ${context || 'General coding & AI practice'}.
${socraticInstruction}
Keep answers concise, pedagogical, engaging, and directly applicable.`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message || 'Bonjour, peux-tu m\'aider ?',
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return res.json({ reply: response.text || '' });
    }

    // High quality offline fallback
    let fallbackReply = '';
    if (socraticMode) {
      if (lang === 'English') {
        fallbackReply = `Great question! Before looking at the code, what is the expected input type and what should the function return in the edge case? Try breaking down step 1.`;
      } else {
        fallbackReply = `Excellente question ! Avant d'écrire le code, quel est le type d'entrée attendu et que devrait renvoyer la fonction dans le cas limite ? Essaie de décomposer la première étape.`;
      }
    } else {
      if (lang === 'English') {
        fallbackReply = `Here is a tip from ${tutorName}: Make sure to verify your variable types and test with a simple case first. You can use console.log to inspect values step-by-step!`;
      } else {
        fallbackReply = `Voici un conseil de ${tutorName} : Assure-toi de bien vérifier les types de tes variables et teste avec un cas simple d'abord. Tu peux utiliser console.log pour inspecter les valeurs pas à pas !`;
      }
    }
    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Route: Custom Exercise Generator
app.post('/api/gemini/exercise', async (req, res) => {
  try {
    const { topic, difficulty, language } = req.body;
    const lang = language === 'en' ? 'English' : 'French';

    const systemInstruction = `You are an expert curriculum architect at Finjaro Learn.
Create a custom, high-quality, practical coding exercise in JSON format.
Target language for texts: ${lang}.
Topic: ${topic || 'Python loops'}.
Difficulty: ${difficulty || 'Intermédiaire'}.

Return ONLY valid JSON matching this schema:
{
  "title": "Title of the exercise",
  "description": "Clear statement of what needs to be solved",
  "instructions": ["Step 1", "Step 2"],
  "starterCode": "function solve() {\\n  // Your code here\\n}",
  "solution": "function solve() { return true; }",
  "testCases": [
    {"input": "sample", "expected": "result", "description": "basic test"}
  ],
  "hint": "Useful conceptual hint"
}`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate a custom verified exercise for topic: ${topic}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    }

    // High quality offline fallback
    const fallbackExercise = {
      title: lang === 'English' ? `Challenge: Custom ${topic || 'Algorithm'}` : `Défi : ${topic || 'Algorithme'} sur mesure`,
      description: lang === 'English'
        ? `Implement an optimized function that processes input data and filters anomalies.`
        : `Implémentez une fonction optimisée qui traite les données d'entrée et filtre les anomalies.`,
      instructions: lang === 'English'
        ? ["Take an array of numbers as input", "Filter out values below threshold", "Return the sum of remaining elements"]
        : ["Prenez un tableau de nombres en entrée", "Filtrez les valeurs sous le seuil", "Renvoyez la somme des éléments restants"],
      starterCode: `function processMetrics(data, threshold) {\n  // Votre code ici\n  \n}`,
      solution: `function processMetrics(data, threshold) {\n  return data.filter(x => x >= threshold).reduce((a, b) => a + b, 0);\n}`,
      testCases: [
        { input: "data = [10, 5, 20, 2], threshold = 10", expected: "30", description: "Filtre [10, 20] -> 30" },
        { input: "data = [1, 2, 3], threshold = 10", expected: "0", description: "Aucun élément -> 0" }
      ],
      hint: lang === 'English' ? "Use Array.prototype.filter and reduce." : "Utilisez les méthodes .filter() et .reduce() pour une écriture concise."
    };
    return res.json(fallbackExercise);
  } catch (error: any) {
    console.error('Exercise generator error:', error);
    return res.status(500).json({ error: error.message || 'Error generating exercise' });
  }
});

// Route: Flashcards & Quiz Generator
app.post('/api/gemini/flashcards', async (req, res) => {
  try {
    const { topic, lessonTitle, language } = req.body;
    const lang = language === 'en' ? 'English' : 'French';

    const systemInstruction = `You are a learning science specialist at Finjaro.
Create 4 revision flashcards (front question, back answer + code snippet) and 3 multiple-choice quiz questions for the topic: ${topic || lessonTitle}.
Language: ${lang}.
Return ONLY JSON:
{
  "flashcards": [
    { "front": "Question or term", "back": "Clear concise explanation", "codeSnippet": "optional code" }
  ],
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate flashcards and quiz for: ${topic || lessonTitle}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    }

    // High quality offline fallback
    const fallback = {
      flashcards: [
        {
          front: lang === 'English' ? `What is the core difference between Supervised and Unsupervised Learning?` : `Quelle est la différence fondamentale entre Apprentissage Supervisé et Non Supervisé ?`,
          back: lang === 'English' ? `Supervised learning uses labeled training data (X, y) with target ground truth. Unsupervised learning discovers latent patterns/clusters without predefined labels.` : `L'apprentissage supervisé s'appuie sur des données étiquetées (X, y) avec une vérité terrain. Le non-supervisé cherche des structures ou clusters sans étiquettes préalables.`,
          codeSnippet: `// Supervisé: model.fit(X_train, y_train)\n// Non supervisé: kmeans.fit(X_unlabeled)`
        },
        {
          front: lang === 'English' ? `Why is an activation function like ReLU crucial in Neural Networks?` : `Pourquoi une fonction d'activation comme ReLU est-elle indispensable dans un réseau de neurones ?`,
          back: lang === 'English' ? `Without non-linear activations, stacking multiple layers would collapse into a single linear transformation (W2 * W1 * x = W_combined * x). ReLU introduces non-linearity.` : `Sans fonction non linéaire, la composition de couches se réduirait à une simple transformation linéaire affine. ReLU introduit la non-linéarité permettant d'approximer toute fonction.`,
          codeSnippet: `const relu = (x) => Math.max(0, x);`
        },
        {
          front: lang === 'English' ? `What is the Role of Cosine Similarity in RAG systems?` : `Quel est le rôle de la similarité cosinus dans un système RAG ?`,
          back: lang === 'English' ? `It measures the cosine of the angle between two embedding vectors, independent of vector magnitude, to determine semantic proximity.` : `Elle mesure le cosinus de l'angle entre deux vecteurs d'embeddings pour évaluer leur proximité sémantique, indépendamment de la norme.`,
          codeSnippet: `similarity = dot(A, B) / (norm(A) * norm(B));`
        }
      ],
      quiz: [
        {
          question: lang === 'English' ? `Which activation function returns 0 for negative inputs and x for positive ones?` : `Quelle fonction d'activation renvoie 0 pour les entrées négatives et x pour les positives ?`,
          options: ["Sigmoid", "ReLU", "Softmax", "Tanh"],
          correctIndex: 1,
          explanation: lang === 'English' ? `ReLU (Rectified Linear Unit) is defined as f(x) = max(0, x).` : `ReLU (Rectified Linear Unit) est définie par f(x) = max(0, x).`
        },
        {
          question: lang === 'English' ? `In public key cryptography (RSA), which key is used to decrypt a message?` : `En cryptographie asymétrique (RSA), quelle clé sert à déchiffrer un message chiffré avec la clé publique ?`,
          options: ["La clé publique", "La clé privée", "La clé de session partagée", "Le hachage SHA-256"],
          correctIndex: 1,
          explanation: lang === 'English' ? `The private key (d, n) is kept secret and allows decrypting messages encrypted with public key (e, n).` : `La clé privée (d, n) est gardée secrète et permet de déchiffrer les messages chiffrés avec la clé publique.`
        }
      ]
    };
    return res.json(fallback);
  } catch (error: any) {
    console.error('Flashcards error:', error);
    return res.status(500).json({ error: error.message || 'Error generating flashcards' });
  }
});

// Route: Career Studio (CV & Cover Letter)
app.post('/api/gemini/career', async (req, res) => {
  try {
    const { type, role, userProfile, targetCompany, language } = req.body;
    const lang = language === 'en' ? 'English' : 'French';

    const systemInstruction = `You are a premier tech recruiter and executive career mentor at Finjaro.
Create a polished, modern, high-impact ${type === 'coverLetter' ? 'cover letter' : 'resume section'} targeting the role: ${role || 'AI Engineer / Full-Stack Developer'}.
Target company: ${targetCompany || 'Tech Scale-up'}.
User projects on Finjaro Learn: ${JSON.stringify(userProfile?.projects || ['Neural Network from scratch', 'RAG Document Search Engine', 'Mini 8-bit CPU Simulator', 'RSA Asymmetric Cryptography'])}.
Language: ${lang}.
Structure with modern tech industry best practices (impact metrics, tech keywords, clean markdown).`;

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate a tech career document of type: ${type}`,
        config: { systemInstruction },
      });
      return res.json({ result: response.text || '' });
    }

    // High quality offline fallback
    let fallbackText = '';
    if (type === 'coverLetter') {
      fallbackText = lang === 'English'
        ? `Dear Hiring Team at ${targetCompany || 'Tech Company'},

I am writing to express my strong interest in the ${role || 'AI & Software Engineer'} position. Having built deep foundational systems on Finjaro Learn—including a custom Neural Network with backpropagation from scratch, an end-to-end RAG semantic search engine, and a virtual 8-bit CPU architecture—I combine hands-on engineering rigor with deep AI comprehension.

I look forward to discussing how my practical skills can deliver tangible value to your products.

Sincerely,
${userProfile?.name || 'Finjaro Engineer'}`
        : `Madame, Monsieur,

C'est avec un vif enthousiasme que je vous adresse ma candidature pour le poste de ${role || 'Ingénieur IA & Développeur Full-Stack'} au sein de ${targetCompany || 'votre entreprise'}. 

Formé(e) de manière intensive sur Finjaro Learn par la pratique immédiate du code, j'ai développé des projets d'ingénierie concrets : un réseau de neurones avec rétropropagation codé de zéro, un moteur de recherche RAG vectoriel, un mini-processeur 8 bits virtuel ainsi qu'un système de chiffrement asymétrique RSA. Cette maîtrise des couches basses et des modèles de pointe me permet d'aborder vos défis techniques avec rigueur et autonomie.

Je serais ravi(e) d'échanger avec vous lors d'un entretien pour vous présenter mes réalisations.

Cordialement,
${userProfile?.name || 'Apprenant Finjaro'}`;
    } else {
      fallbackText = lang === 'English'
        ? `### Selected AI & Software Engineering Projects

**Neural Network & Autograd Engine**
- Designed a multi-layer perceptron with matrix forward-pass and backpropagation from scratch.
- Visualized decision boundary convergence on non-linear XOR datasets.

**RAG Semantic Search & Retrieval Assistant**
- Built document chunking pipeline and vector embeddings similarity calculation using cosine distance.
- Integrated hallucination guardrails and source attribution citations.

**Virtual 8-bit Mini-Processor Architecture**
- Implemented ALU operations (ADD, SUB, AND, OR) with register bank and instruction cycle decoder.
- Executed assembly programs in virtual RAM.`
        : `### Projets d'Ingénierie IA & Logiciel

**Réseau de Neurones & Rétropropagation de Zéro**
- Conception d'un perceptron multicouche avec passe avant matricielle et rétropropagation du gradient.
- Visualisation interactive de la frontière de décision sur jeux de données non linéaires (XOR).

**Assistant RAG & Recherche Sémantique Documentaire**
- Pipeline de découpage (chunking) et calcul de similarité vectorielle cosinus.
- Filtrage contextuel et ancrage des réponses avec citations vérifiées.

**Mini-Processeur Virtuel & Architecture 8-bits**
- Implémentation de l'ALU (ADD, SUB, AND, OR), des registres (A, B, PC) et du cycle d'instructions.
- Décodage et exécution de programmes en assembleur dans une mémoire RAM émulée.`;
    }

    return res.json({ result: fallbackText });
  } catch (error: any) {
    console.error('Career studio error:', error);
    return res.status(500).json({ error: error.message || 'Error generating career doc' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Finjaro Learn server running on http://0.0.0.0:${port} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
