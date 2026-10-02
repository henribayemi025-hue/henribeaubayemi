export type FilterType = 'all' | 'github' | 'prompts' | 'news';

export interface GitHubRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
  languages: { name: string; color: string }[];
  stars: number;
  todayStars: number;
  forks: number;
  url: string;
  isStarred?: boolean;
  isBookmarked?: boolean;
  category: 'LLM' | 'Agents' | 'UI' | 'Tooling';
}

export interface AIPrompt {
  id: string;
  title: string;
  modelBadge: string;
  modelFamily: 'claude' | 'gpt' | 'gemini';
  shortDesc: string;
  category: string;
  tokenCount: number;
  efficiencyRating: string;
  variables: { name: string; defaultValue: string; description: string }[];
  template: string;
  explanation: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  headline: string;
  tags: string[];
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  keyTakeaways: string[];
  fullContent: string[];
  accentColor: 'cyan' | 'violet' | 'emerald';
  badgeLabel: string;
}
