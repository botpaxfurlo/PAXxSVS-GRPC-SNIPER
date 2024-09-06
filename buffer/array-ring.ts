export class ArrayRing {
    private capacity: number;
    private data: any[];
    private key: string[];

    constructor(capacity: number) {
        if (capacity <= 0) {
            throw new Error("Capacity must be greater than 0");
        }
        this.capacity = capacity;
        this.data = [];
        this.key = [];
    }

    push(mint: string, data: any): void {

        const existsAt = this.indexFromLatest(mint);
        if (existsAt !== undefined) {
            this.key.splice(existsAt,1);
            this.data.splice(existsAt,1);
        } else if (this.key.length >= this.capacity) {
            this.key.shift();
            this.data.shift();
        }

        this.key.push(mint);
        this.data.push(data);
        
    }
    
    searchFromLatest(mint: string): any | undefined {
        for (let i = this.key.length - 1; i >= 0; i--) {
            const key = this.key[i];
            if (key === mint) {
                return this.data[i];
            }
        }
        return undefined;
    }

    private indexFromLatest(mint: string): any | undefined {
        for (let i = this.key.length - 1; i >= 0; i--) {
            const key = this.key[i];
            if (key == mint) {
                return i;
            }
        }
        return undefined;
    }

}