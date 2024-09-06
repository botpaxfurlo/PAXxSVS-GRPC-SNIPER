import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { LIST_REFRESH_INTERVAL } from '../constants/constants';

export class KeywordBlacklistCache {
  public keywordBlacklist: string[] = [];
  private fileLocation = path.join(__dirname, '../keyword-blacklist.txt');

  constructor() {
    setInterval(() => this.loadKeywordBlacklist(), LIST_REFRESH_INTERVAL);
  }

  public init() {
    this.loadKeywordBlacklist();
  }

  public isInList(mint: string) {
    return this.keywordBlacklist.includes(mint);
  }

  private loadKeywordBlacklist() {

    const count = this.keywordBlacklist.length;
    const data = fs.readFileSync(this.fileLocation, 'utf-8');
    this.keywordBlacklist = data
      .split('\n')
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a);

    if (this.keywordBlacklist.length != count) {
      logger.info(`Loaded keyword blacklist: ${this.keywordBlacklist.length}`);
    }
  }
}
