export type FilterCategory = 'all' | 'github' | 'prompts' | 'news';

export interface GitHubRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
  stars: number;
  starsToday: number;
  forks: number;
  languages: { name: string; color: string }[];
  primaryLanguage: string;
  url: string;
  rank: number;
  isStarred?: boolean;
}

export interface PromptOfTheDay {
  id: string;
  title: string;
  targetModel: string;
  modelBadge: string;
  recommendedParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  context: string;
  fullPrompt: string;
  variables: { key: string; label: string; defaultValue: string }[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  estimatedTokens: number;
  useCase: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  fullBody: string;
  tags: string[];
  readTime: string;
  publishedAt: string;
  author: string;
  source: string;
  visualTheme: 'neural' | 'agents' | 'hardware';
  keyPoints: string[];
}
