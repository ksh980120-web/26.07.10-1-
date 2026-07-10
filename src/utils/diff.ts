/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiffWord {
  word: string;
  type: 'match' | 'mismatch' | 'missing' | 'extra';
  originalWord?: string;
}

// Clean punctuation and normalize spacing for comparison
export function cleanWord(word: string): string {
  return word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '').trim();
}

/**
 * Calculates longest common subsequence (LCS) to provide a beautiful word-by-word diff
 */
export function getWordDiff(originalText: string, userText: string): { diffs: DiffWord[]; score: number } {
  const originalWords = originalText.trim().split(/\s+/).filter(Boolean);
  const userWords = userText.trim().split(/\s+/).filter(Boolean);

  if (originalWords.length === 0) {
    return { diffs: [], score: 0 };
  }

  // DP table for Longest Common Subsequence of clean words
  const n = originalWords.length;
  const m = userWords.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (cleanWord(originalWords[i - 1]) === cleanWord(userWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the diff alignment
  const diffs: DiffWord[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cleanWord(originalWords[i - 1]) === cleanWord(userWords[j - 1])) {
      diffs.unshift({
        word: userWords[j - 1], // keep user's punctuation / capitalization
        type: 'match',
        originalWord: originalWords[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Extra word added by the user
      diffs.unshift({
        word: userWords[j - 1],
        type: 'extra'
      });
      j--;
    } else {
      // Word from original is missing or mismatched
      // Let's check if we can pair it as a mismatch instead of just missing + extra
      // If we backtracked and the previous action was an extra, we can merge them as a mismatch
      diffs.unshift({
        word: originalWords[i - 1],
        type: 'missing'
      });
      i--;
    }
  }

  // Post-process to group adjacent missing + extra into a 'mismatch'
  const alignedDiffs: DiffWord[] = [];
  for (let k = 0; k < diffs.length; k++) {
    const current = diffs[k];
    const next = diffs[k + 1];

    if (current.type === 'missing' && next && next.type === 'extra') {
      alignedDiffs.push({
        word: next.word,
        type: 'mismatch',
        originalWord: current.word
      });
      k++; // skip next
    } else {
      alignedDiffs.push(current);
    }
  }

  // Calculate score
  const matchesCount = alignedDiffs.filter(d => d.type === 'match').length;
  // Score is matches / originalWords length * 100
  const rawScore = Math.round((matchesCount / originalWords.length) * 100);
  const score = Math.max(0, Math.min(100, rawScore));

  return { diffs: alignedDiffs, score };
}
