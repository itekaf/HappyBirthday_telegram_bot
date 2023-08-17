import {config, DotenvParseOutput } from 'dotenv';

export class ConfigService {
    private config: DotenvParseOutput;

    constructor() {
        const {error, parsed} = config();

        if (error) {
            throw new Error('Error of parsing env file');
        }

        if (!parsed) {
            throw new Error('env file is empty');
        }

        this.config = parsed;
    }

    get(key: string): string {
        const result = this.config[key];
        if (!result) {
            throw new Error(`Key doesn't exist`)
        }
        return  result;
    }
}
