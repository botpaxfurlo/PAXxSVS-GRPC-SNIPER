export class TokensProcessedCache {
  private tokensProcessed: string[] = [];

  constructor() {
    
  }

  public isInList(mint: string, useBinarySearch?: boolean) {
    if (useBinarySearch) {
      return this.isInListBS(mint);
    } else {
      return this.tokensProcessed.includes(mint);
    }
  }

  private isInListBS(mint: string): boolean {
    let left = 0;
    let right = this.tokensProcessed.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midVal = this.tokensProcessed[mid];

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

  public saveSorted(token: string) {
    let left = 0;
    let right = this.tokensProcessed.length - 1;

    // Perform binary search to find the correct insertion point
    while (left <= right) {
        const middle = Math.floor((left + right) / 2);
        if (this.tokensProcessed[middle] < token) {
            left = middle + 1;
        } else {
            right = middle - 1;
        }
    }

    // Insert the token at the found position
    this.tokensProcessed.splice(left, 0, token);
  }
}