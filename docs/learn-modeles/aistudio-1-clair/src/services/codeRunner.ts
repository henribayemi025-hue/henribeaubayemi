import { TestCase } from '../types';

export interface CodeRunResult {
  success: boolean;
  logs: string[];
  testResults: {
    description: string;
    call: string;
    expected: any;
    actual: any;
    passed: boolean;
    error?: string;
  }[];
  executionTimeMs: number;
  syntaxError?: string;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 0.0001; // handle floating point tolerances
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

export function executeUserCode(
  code: string,
  testCases: TestCase[],
  lang: 'fr' | 'en'
): CodeRunResult {
  const startTime = performance.now();
  const logs: string[] = [];

  // Override console.log for sandbox capture
  const originalLog = console.log;
  const capturedLogs: string[] = [];
  const customLog = (...args: any[]) => {
    capturedLogs.push(
      args
        .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
        .join(' ')
    );
  };

  try {
    // Basic syntax test and main script execution
    const scriptFunction = new Function(
      'console',
      `
      ${code}
    `
    );

    scriptFunction({
      log: customLog,
      info: customLog,
      warn: customLog,
      error: customLog,
    });
  } catch (err: any) {
    return {
      success: false,
      logs: capturedLogs,
      testResults: [],
      executionTimeMs: Math.round(performance.now() - startTime),
      syntaxError: err.message || 'Erreur d\'exécution du code',
    };
  }

  // Now execute each test case against the defined functions
  const testResults = testCases.map((tc) => {
    const desc = lang === 'en' ? tc.description.en : tc.description.fr;
    try {
      // Evaluate test call within the context of the user code
      const runner = new Function(
        `
        ${code}
        return (${tc.call});
      `
      );
      const actual = runner();
      const passed = deepEqual(actual, tc.expected);

      return {
        description: desc,
        call: tc.call,
        expected: tc.expected,
        actual,
        passed,
      };
    } catch (err: any) {
      return {
        description: desc,
        call: tc.call,
        expected: tc.expected,
        actual: undefined,
        passed: false,
        error: err.message || 'Exception levée pendant le test',
      };
    }
  });

  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);
  const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

  return {
    success: allPassed,
    logs: capturedLogs,
    testResults,
    executionTimeMs,
  };
}
