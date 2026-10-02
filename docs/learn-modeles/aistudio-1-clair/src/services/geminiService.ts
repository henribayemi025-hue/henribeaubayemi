import { Flashcard, QuizQuestion } from '../types';

export async function askTutorChat(params: {
  message: string;
  tutorName: string;
  personality: string;
  socraticMode: boolean;
  context?: string;
  language: 'fr' | 'en';
}): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('API server error');
    const data = await res.json();
    return data.reply || '';
  } catch (error) {
    console.warn('Fallback to local tutor heuristic:', error);
    if (params.socraticMode) {
      return params.language === 'en'
        ? `Let's break this down Socratic-style: What does the first line of your function receive as input, and what data type is expected in return?`
        : `Décomposons cela à la façon socratique : que reçoit la première ligne de ta fonction en entrée, et quel type de données est attendu en sortie ?`;
    }
    return params.language === 'en'
      ? `Review your variable scope and test edge cases like empty arrays or zero values.`
      : `Vérifie la portée de tes variables et teste les cas limites comme un tableau vide ou une valeur nulle.`;
  }
}

export async function generateCustomExercise(params: {
  topic: string;
  difficulty: string;
  language: 'fr' | 'en';
}): Promise<any> {
  try {
    const res = await fetch('/api/gemini/exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('API server error');
    return await res.json();
  } catch (error) {
    console.warn('Fallback to default custom exercise:', error);
    return {
      title: params.language === 'en' ? `Challenge: Custom ${params.topic}` : `Défi : ${params.topic} sur mesure`,
      description: params.language === 'en'
        ? 'Implement an optimized filter and reduction function.'
        : 'Implémentez une fonction de filtrage et réduction optimisée.',
      instructions: params.language === 'en'
        ? ['Accept an array of numbers', 'Filter out values below threshold', 'Return the sum']
        : ['Acceptez un tableau de nombres', 'Filtrez les valeurs sous le seuil', 'Renvoyez la somme'],
      starterCode: `function customSolve(data, threshold) {\n  // Votre solution\n  \n}`,
      solution: `function customSolve(data, threshold) {\n  return data.filter(x => x >= threshold).reduce((a, b) => a + b, 0);\n}`,
      testCases: [
        { call: 'customSolve([10, 20, 5], 10)', expected: 30, description: { fr: 'Filtre [10, 20] -> 30', en: 'Filter [10, 20] -> 30' } },
      ],
      hints: {
        fr: ['Pensez à .filter() et .reduce()'],
        en: ['Think about .filter() and .reduce()'],
      },
    };
  }
}

export async function generateFlashcardsAndQuiz(params: {
  topic: string;
  lessonTitle?: string;
  language: 'fr' | 'en';
}): Promise<{ flashcards: Flashcard[]; quiz: QuizQuestion[] }> {
  try {
    const res = await fetch('/api/gemini/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('API server error');
    return await res.json();
  } catch (error) {
    console.warn('Fallback to default flashcards:', error);
    return {
      flashcards: [
        {
          front: params.language === 'en' ? 'What does a learning rate control in Gradient Descent?' : 'Que contrôle le taux d\'apprentissage (learning rate) ?',
          back: params.language === 'en' ? 'It sets the step size taken along the negative gradient vector towards the minimum.' : 'Il définit la taille du pas franchi le long du gradient négatif vers le minimum de la fonction de coût.',
          codeSnippet: 'weight = weight - learningRate * gradient;',
        },
        {
          front: params.language === 'en' ? 'What is the purpose of Softmax?' : 'À quoi sert la fonction Softmax ?',
          back: params.language === 'en' ? 'Converts unnormalized logits into a normalized probability distribution summing to 1.' : 'Transforme un vecteur de logits non normalisés en distribution de probabilités dont la somme vaut 1.',
          codeSnippet: 'softmax(z_i) = exp(z_i) / sum(exp(z_j))',
        },
      ],
      quiz: [
        {
          question: params.language === 'en' ? 'Which component is responsible for arithmetic operations in a computer?' : 'Quel composant effectue les opérations arithmétiques dans un ordinateur ?',
          options: ['RAM', 'ALU', 'ROM', 'Clock'],
          correctIndex: 1,
          explanation: params.language === 'en' ? 'The Arithmetic Logic Unit (ALU) computes mathematical and bitwise operations.' : 'L\'Unité Arithmétique et Logique (ALU) calcule les additions, soustractions et opérations logiques.',
        },
      ],
    };
  }
}

export async function generateCareerDoc(params: {
  type: 'cv' | 'coverLetter';
  role: string;
  targetCompany?: string;
  userProfile: any;
  language: 'fr' | 'en';
}): Promise<string> {
  try {
    const res = await fetch('/api/gemini/career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('API server error');
    const data = await res.json();
    return data.result || '';
  } catch (error) {
    console.warn('Fallback career text:', error);
    return params.language === 'en'
      ? `### Proven Finjaro Engineering Portfolio\n\n- Built full forward/backward propagation neural network from scratch.\n- Implemented RAG semantic search engine with vector similarity.\n- Designed virtual 8-bit CPU ALU and verified RSA modular arithmetic.`
      : `### Réalisations Pratiques sur Finjaro Learn\n\n- Développement complet d'un réseau de neurones avec rétropropagation du gradient.\n- Implémentation d'un assistant RAG avec découpage et similarité cosinus vectorielle.\n- Conception d'un mini-processeur 8-bits virtuel et calcul modulaire RSA.`;
  }
}
