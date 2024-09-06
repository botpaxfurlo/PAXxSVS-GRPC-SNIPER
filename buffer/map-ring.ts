export class SmallBufferRing {
    private capacity: number;
    private map: Map<string, any>;
    private keys: string[];

    constructor(capacity: number) {
        if (capacity <= 0) {
            throw new Error("Capacity must be greater than 0");
        }
        this.capacity = capacity;
        this.map = new Map<string, any>();
        this.keys = [];
    }

    add(key: string, value: any): void {
        if (this.map.has(key)) {
            this.map.delete(key);
            this.keys = this.keys.filter(k => k !== key);
        } else if (this.keys.length >= this.capacity) {
            const oldestKey = this.keys.shift();
            if (oldestKey !== undefined) {
                this.map.delete(oldestKey);
            }
        }

        this.map.set(key, value);
        this.keys.push(key);
    }

    search(key: string): any | undefined {
        const value = this.map.get(key);
        return value;
    }

}