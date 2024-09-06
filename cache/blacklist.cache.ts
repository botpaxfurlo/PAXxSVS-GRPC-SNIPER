import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { LIST_REFRESH_INTERVAL } from '../constants/constants';
import { overwriteFile } from '../utils/file';

export class BlacklistCache {
  private blacklist: string[] = [];
  private fileLocation = path.join(__dirname, '../blacklist.txt');
  private initialExecution: boolean;

  constructor() {
    this.initialExecution = true;
    setInterval(() => this.loadBlacklist(true), LIST_REFRESH_INTERVAL);
  }

  public init(quiet?: boolean) {
    if (quiet === true){
      this.loadBlacklist(quiet);
    } else {
      this.loadBlacklist();
    }

    this.sortBlacklist()

    if (this.initialExecution) {
      this.removeDuplicates();
      this.saveBlacklistToFile();
      this.initialExecution = false;
    }
  }

  public isInList(mint: string) {
    return this.blacklist.includes(mint);
  }

  private loadBlacklist(quiet?: boolean) {

    const count = this.blacklist.length;
    const data = fs.readFileSync(this.fileLocation, 'utf-8');
    this.blacklist = data
      .split('\n')
      .map((a) => a.trim())
      .filter((a) => a);

    if (this.blacklist.length != count) {
      if (quiet === true){
        return;
      } else {
        logger.info(`Loaded blacklist: ${this.blacklist.length}`);
      }
      
    }
  }

  private sortBlacklist() {
    this.blacklist.sort();
  }

  public isInListBS(mint: string): boolean {
    let left = 0;
    let right = this.blacklist.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midVal = this.blacklist[mid];

      if (midVal === mint) {
        return true;
      } else if (midVal < mint) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return false;
  }

  private saveBlacklistToFile() {
    overwriteFile(this.fileLocation,this.blacklist);
  }

  private removeDuplicates() {
    this.blacklist = Array.from(new Set(this.blacklist));
  }

}
