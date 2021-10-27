/**
 * @see https://www.npmjs.com/package/node-json-db
 */

import { JsonDB } from 'node-json-db';
import { Config } from 'node-json-db/dist/lib/JsonDBConfig';

export const DB = new JsonDB(new Config('./data/data.json', false, false, '/'));

try {
	DB.getData('/chats/');
} catch {
	DB.push('/chats/', {});
}
try {
	DB.getData('/users/');
} catch {
	DB.push('/users/', {});
}
try {
	DB.getData('/system/');
} catch {
	DB.push('/system/', {});
}

export const intervalID = setInterval(() => {
	DB.save();
}, 10000);
