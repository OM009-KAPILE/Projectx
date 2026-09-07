import https from 'https';
import { GitHubProfileData, GitHubRepositoryItem, GitHubLanguageShare } from '@projectx/common';

const GITHUB_LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Solidity: '#AA6746',
  Shell: '#89e051',
  Ruby: '#701516',
};

export class GitHubService {
  /**
   * Cleans and extracts a GitHub username from a URL or raw handle
   */
  public static extractUsername(urlOrHandle: string): string {
    if (!urlOrHandle) return '';
    let cleaned = urlOrHandle.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^www\./i, '');
    cleaned = cleaned.replace(/^github\.com\//i, '');
    cleaned = cleaned.split('/')[0] || '';
    cleaned = cleaned.replace(/^@/, '');
    return cleaned.trim();
  }

  /**
   * Helper to perform HTTP GET request with proper User-Agent headers
   */
  private static async httpsGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'User-Agent': 'ProjectX-Student-Platform/1.0',
        Accept: 'application/vnd.github.v3+json',
      };

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const req = https.get(url, { headers, timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('GitHub API request timed out'));
      });
    });
  }

  /**
   * Fetches public repositories, top languages, and profile details with graceful fallback
   */
  public static async fetchGitHubProfileData(
    urlOrUsername: string,
    userDeclaredSkills: Array<{ name: string; proficiency?: number }> = []
  ): Promise<GitHubProfileData> {
    const username = this.extractUsername(urlOrUsername);
    const profileUrl = username ? `https://github.com/${username}` : urlOrUsername;

    if (!username) {
      return {
        username: '',
        profileUrl: urlOrUsername || '',
        publicReposCount: 0,
        languages: [],
        repositories: [],
        relevantRepositories: [],
        isLiveSync: false,
        lastSyncedAt: new Date().toISOString(),
        fallbackMessage: 'No valid GitHub profile provided.',
      };
    }

    try {
      // 1. Fetch User Info
      const userUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
      const userData = await this.httpsGet(userUrl);

      // 2. Fetch Public Repositories (up to 30 most recent)
      const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`;
      const reposData = await this.httpsGet(reposUrl);

      const repositories: GitHubRepositoryItem[] = Array.isArray(reposData)
        ? reposData.map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description || null,
            url: r.html_url,
            language: r.language || null,
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            updatedAt: r.updated_at,
            topics: Array.isArray(r.topics) ? r.topics : [],
          }))
        : [];

      // 3. Compute Language Distribution Breakdown
      const langCounts: Record<string, number> = {};
      let totalLangs = 0;
      for (const repo of repositories) {
        if (repo.language) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
          totalLangs += 1;
        }
      }

      const languages: GitHubLanguageShare[] = Object.entries(langCounts)
        .map(([lang, count]) => ({
          name: lang,
          percentage: totalLangs > 0 ? Math.round((count / totalLangs) * 100) : 0,
          color: GITHUB_LANGUAGE_COLORS[lang] || '#64748b',
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // 4. Map Relevant Repositories for Student's Declared Skills
      const relevantRepositories = userDeclaredSkills.map((sk) => {
        const norm = sk.name.toLowerCase().trim();
        const matched = repositories.filter((r) => {
          const matchLang = r.language && norm.includes(r.language.toLowerCase());
          const matchName = r.name.toLowerCase().includes(norm) || norm.includes(r.name.toLowerCase());
          const matchTopics = r.topics.some((t) => norm.includes(t.toLowerCase()) || t.toLowerCase().includes(norm));
          return matchLang || matchName || matchTopics;
        });

        return {
          skillName: sk.name,
          repositories: matched,
        };
      });

      return {
        username: userData.login || username,
        profileUrl: userData.html_url || profileUrl,
        avatarUrl: userData.avatar_url || null,
        publicReposCount: userData.public_repos || repositories.length,
        followers: userData.followers || 0,
        languages,
        repositories,
        relevantRepositories,
        isLiveSync: true,
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      // Graceful fallback to static profile URL when GitHub API is rate-limited, offline, or unavailable
      console.warn(`[GitHubService] Graceful fallback for "${username}": ${error.message}`);

      return {
        username,
        profileUrl,
        publicReposCount: 0,
        languages: [],
        repositories: [],
        relevantRepositories: userDeclaredSkills.map((s) => ({
          skillName: s.name,
          repositories: [],
        })),
        isLiveSync: false,
        lastSyncedAt: new Date().toISOString(),
        fallbackMessage: 'GitHub API live metrics unavailable. Displaying profile URL fallback.',
      };
    }
  }
}
