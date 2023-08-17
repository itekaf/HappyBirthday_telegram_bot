import * as LocalSession from 'telegraf-session-local';

export class SessionService {
    private dbName = 'session_db';

    init() {
        const localSession = new LocalSession({
            // Database name/path, where sessions will be located (default: 'sessions.json')
            database: `${this.dbName}.json`,
            // Name of session property object in Telegraf Context (default: 'session')
            property: 'session',
            // Type of lowdb storage (default: 'storageFileSync')
            storage: LocalSession.storageFileAsync,
            // Format of storage/database (default: JSON.stringify / JSON.parse)
            format: {
                serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
                deserialize: (str) => JSON.parse(str),
            },
            // We will use `messages` array in our database to store user messages using exported lowdb instance from LocalSession via Telegraf Context
            state: { messages: [] }
        })

        // Wait for database async initialization finished (storageFileAsync or your own asynchronous storage adapter)
        // @ts-ignore
        localSession.DB.then(DB => {
            // Database now initialized, so now you can retrieve anything you want from it
            console.log('Current LocalSession DB:', DB.value())
        });
        return localSession.middleware();
    }
}
