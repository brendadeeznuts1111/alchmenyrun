import { Octokit } from '@octokit/rest';

export class GitHubTriageClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string = 'brendadeeznuts1111', repo: string = 'alchmenyrun') {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const response = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      user: { login: response.data.user?.login || 'unknown' },
      repository: { full_name: `${this.owner}/${this.repo}` },
      labels: response.data.labels.map(label =>
        typeof label === 'string' ? { name: label } : { name: label.name }
      )
    };
  }

  async addLabels(issueNumber: number, labels: string[]): Promise<void> {
    if (labels.length === 0) return;

    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels
    });
  }

  async createIssue(title: string, body: string, labels: string[] = []): Promise<number> {
    const response = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels
    });

    return response.data.number;
  }
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  user: { login: string };
  repository?: { full_name: string };
  labels: Array<{ name: string }>;
}
