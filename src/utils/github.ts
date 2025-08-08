import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface GitHubFileContent {
  path: string;
  content: string;
  message: string;
  sha?: string; // Required for updates
}

export interface GitHubAuthResult {
  success: boolean;
  user?: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  };
  error?: string;
}

export class GitHubService {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  /**
   * Validate GitHub Personal Access Token and get user info
   */
  async validateToken(): Promise<GitHubAuthResult> {
    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      
      // Check if user has write access to the repository
      try {
        await this.octokit.rest.repos.get({
          owner: this.config.owner,
          repo: this.config.repo,
        });
      } catch (error) {
        return {
          success: false,
          error: 'Token does not have access to the repository'
        };
      }

      return {
        success: true,
        user: {
          login: user.login,
          name: user.name || user.login,
          email: user.email || '',
          avatar_url: user.avatar_url,
        }
      };
    } catch (error) {
      console.error('GitHub token validation error:', error);
      return {
        success: false,
        error: 'Invalid GitHub token or insufficient permissions'
      };
    }
  }

  /**
   * Get file content from repository
   */
  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if ('content' in data && data.type === 'file') {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha,
        };
      }
      return null;
    } catch (error) {
      console.error(`Error getting file ${path}:`, error);
      return null;
    }
  }

  /**
   * Create or update file in repository
   */
  async createOrUpdateFile(fileData: GitHubFileContent): Promise<boolean> {
    try {
      const encodedContent = Buffer.from(fileData.content, 'utf-8').toString('base64');
      
      const params: any = {
        owner: this.config.owner,
        repo: this.config.repo,
        path: fileData.path,
        message: fileData.message,
        content: encodedContent,
      };

      // If sha is provided, this is an update
      if (fileData.sha) {
        params.sha = fileData.sha;
      }

      await this.octokit.rest.repos.createOrUpdateFileContents(params);
      return true;
    } catch (error) {
      console.error(`Error creating/updating file ${fileData.path}:`, error);
      return false;
    }
  }

  /**
   * Delete file from repository
   */
  async deleteFile(path: string, message: string): Promise<boolean> {
    try {
      // First get the file to get its SHA
      const fileInfo = await this.getFile(path);
      if (!fileInfo) {
        console.error(`File ${path} not found`);
        return false;
      }

      await this.octokit.rest.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message,
        sha: fileInfo.sha,
      });

      return true;
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = ''): Promise<Array<{ name: string; path: string; type: 'file' | 'dir' }>> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if (Array.isArray(data)) {
        return data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type as 'file' | 'dir',
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error listing files in ${path}:`, error);
      return [];
    }
  }

  /**
   * Trigger repository dispatch event (for GitHub Actions)
   */
  async triggerDeployment(): Promise<boolean> {
    try {
      await this.octokit.rest.repos.createDispatchEvent({
        owner: this.config.owner,
        repo: this.config.repo,
        event_type: 'deploy',
      });
      return true;
    } catch (error) {
      console.error('Error triggering deployment:', error);
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepoInfo() {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      return data;
    } catch (error) {
      console.error('Error getting repository info:', error);
      return null;
    }
  }
}

/**
 * Create GitHub service instance
 */
export function createGitHubService(token: string): GitHubService {
  // Extract owner and repo from package.json or environment
  const owner = 'redreamality'; // This should be configurable
  const repo = 'redreamality.github.io'; // This should be configurable
  
  return new GitHubService({
    owner,
    repo,
    token,
  });
}

/**
 * Validate GitHub token format
 */
export function isValidGitHubToken(token: string): boolean {
  // GitHub PAT format: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (40 chars after prefix)
  // GitHub fine-grained PAT: github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const patterns = [
    /^ghp_[a-zA-Z0-9]{36}$/, // Classic PAT
    /^github_pat_[a-zA-Z0-9_]{82}$/, // Fine-grained PAT
    /^gho_[a-zA-Z0-9]{36}$/, // OAuth token
    /^ghu_[a-zA-Z0-9]{36}$/, // User-to-server token
    /^ghs_[a-zA-Z0-9]{36}$/, // Server-to-server token
  ];
  
  return patterns.some(pattern => pattern.test(token));
}
