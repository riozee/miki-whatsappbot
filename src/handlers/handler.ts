import * as Baileys from '@adiwajshing/baileys';
import * as fs from 'fs';
import _ from 'lodash';
import * as logger from '../utils/logger';
import * as logger_msg from '../utils/logger-msg';
import { DB } from './database';
import { Message } from '../utils/message';
import * as methods from '../utils/methods';
import type * as Type from '../@types/types';
import * as constants from '../utils/constants';

export const plugins: Type.IPlugin[] = [];

for (const file of fs.readdirSync('./js/plugins/')) {
	if (/\.js$/.test(file)) {
		try {
			plugins.push(require('../plugins/' + file));
		} catch (e) {
			logger.info(e);
		}
	}
}

export async function handler(conn: Baileys.WAConnection, m: Baileys.WAChatUpdate) {
	const message = new Message(m, conn);
	if (message.sender === null) message.sender = conn.user.jid;
	logger_msg.message(conn, message);

	if (!message.json) return;
	if (!message.rjid) return;

	if (
		message.json.key.id?.length === 12 &&
		message.json.key.id?.startsWith(constants.BAILEYS_MESSAGE_ID_PREFIX)
	)
		return;

	const DBChats: Type.IDatabase = DB.getData('/chats/');
	const DBUsers: Type.IDatabase = DB.getData('/users/');
	const DBSystem: Type.IDatabase = DB.getData('/system/');
	const botNumber = conn.user.jid;

	for (const plugin of plugins) {
		if (plugin.onMessage)
			plugin.onMessage(new methods.Wrapper(conn, message, DB, DBChats, DBUsers, DBSystem));
	}

	if (DBUsers[message.sender!]?.pending?.[message.rjid!]?.blockCommand) return;

	let prefix = '/';
	if (message.rjid && typeof DBChats[message.rjid]?.prefix === 'string')
		prefix = DBChats[message.rjid].prefix.toLowerCase();

	let commands: string[] | undefined;
	if (message.rjid && message.text) {
		if (!methods.isGroup({ message: { rjid: message.rjid } } as methods.Wrapper)) {
			commands = methods.parseCommand(message.text, prefix, botNumber, conn.user.name || 'bot');
		} else if (message._quotedsender && message._quotedsender === botNumber) {
			commands = methods.parseCommand(message.text, prefix, botNumber, conn.user.name || 'bot');
		} else if (message.text.startsWith(prefix)) {
			commands = methods.parseCommand(message.text, prefix, botNumber, conn.user.name || 'bot');
		} else if (
			message.mentioned?.includes?.(botNumber) ||
			new RegExp('^\\W*@' + _.escapeRegExp(conn.user.name || 'bot')).test(message.text)
		) {
			commands = methods.parseCommand(message.text, prefix, botNumber, conn.user.name || 'bot');
			if (message.text.trim().startsWith('@' + methods.trimId(botNumber))) {
				if (
					!new RegExp('@' + methods.trimId(botNumber)).test(
						message.text.replace('@' + methods.trimId(botNumber), '')
					)
				) {
					message.mentioned!.splice(
						message.mentioned!.findIndex((v) => v === botNumber),
						1
					);
				}
			}
		}
	}

	// let found = false;
	if (commands?.length) {
		for (const text of commands) {
			for (const plugin of plugins) {
				if (plugin.data?.command?.length) {
					const command = testCommand(plugin.data.command, text);
					if (command) {
						logger.info(`Executing "${plugin.data.command[0]}" command...`);
						if (plugin.onCommand) {
							const $ = new methods.Wrapper(
								conn,
								message,
								DB,
								DBChats,
								DBUsers,
								DBSystem,
								text,
								command,
								getArgument(command, text)
							) as Required<methods.Wrapper>;
							try {
								await plugin.onCommand($);
							} catch (e) {
								logger.error(e);
								// DB.push(
								// 	`/system/errors[]`,
								// 	(e as Error)?.stack ? (e as Error).stack : String(e)
								// );
								methods.sendText($, $.texts.TEXT_ERROR);
							}
							// found = true;
							break;
						}
					}
				}
			}
		}
		// if (!found) {
		// 	if (!DBUsers[message.sender!]?.pending?.[message.rjid!]) {
		// 		if (!DBChats[message.rjid!]?.muted) {
		// 			const $ = new methods.Wrapper(conn, message, DB, DBChats, DBUsers);
		// 			methods.sendText($, $.texts.OPERATION_COMMAND_NOTFOUND);
		// 		}
		// 	}
		// }
	}
}

function testCommand(commands: string[], text: string) {
	for (const command of commands.sort((x, y) => y.length - x.length)) {
		if (new RegExp(`^\\W*${_.escapeRegExp(command).split(' ').join('\\W*')}\\b`, 'i').test(text))
			return command;
	}
	return false;
}

function getArgument(command: string, text: string) {
	return text.replace(
		new RegExp(`^\\W*${_.escapeRegExp(command).split(' ').join('\\W*')}\\b`, 'i'),
		''
	);
}
