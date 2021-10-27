import './_';

import * as logger from './utils/logger';
logger.debug('Starting...');

import * as Baileys from '@adiwajshing/baileys';
import * as fs from 'fs';
import { handler } from './handlers/handler';
import { DB } from './handlers/database';
import * as methods from './utils/methods';

const conn = new Baileys.WAConnection();

conn.logger = logger;

conn.loadAuthInfo('./credentials/auth.json');
logger.debug('Auth info loaded.');

conn.on('open', () =>
	fs.writeFile('./credentials/auth.json', JSON.stringify(conn.base64EncodedAuthInfo()), () =>
		logger.debug('Auth info saved.')
	)
);

conn.on('chat-update', (chat) => handler(conn, chat));

conn.on('close', async (reason) => {
	logger.error(reason);
	DB.save();
	logger.debug('Database saved.');
	if (!reason.isReconnecting) {
		let i = 0;
		while (!(await methods.checkInternetConnection())) {
			logger.error(`Reconnect attempt ${i++} failed: No internet connection.`);
			await methods.pause(1000);
		}
		logger.info(`Connected to internet. Reconnecting...`);
		conn.connect().then((res) => logger.debug('Connected.', res));
	}
});

conn.connect().then((res) => logger.debug('Connected.', res));

process.on('exit', (code) => {
	logger.error(`Process exit with code: ${code}`);
	DB.save();
	logger.debug('Database saved.');
	logger.info("Bye... :')");
});
