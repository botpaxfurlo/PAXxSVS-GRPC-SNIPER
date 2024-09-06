import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { LIST_REFRESH_INTERVAL } from '../constants/constants';

export class KeywordListCache {
  private keywordList: string[] = [];
  private fileLocation = path.join(__dirname, '../keyword-list.txt');

  constructor() {
    setInterval(() => this.loadKeywordList(), LIST_REFRESH_INTERVAL);
  }

  public init() {
    this.loadKeywordList();
  }

  public isInList(mint: string) {
    return this.keywordList.includes(mint);
  }

  private loadKeywordList() {

    const count = this.keywordList.length;
    const data = fs.readFileSync(this.fileLocation, 'utf-8');
    this.keywordList = data
      .split('\n')
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a);

    if (this.keywordList.length != count) {
      logger.info(`Loaded keyword list: ${this.keywordList.length}`);
    }
  }
}
