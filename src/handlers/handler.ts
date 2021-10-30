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

export const pluginsData: Type.PluginData[] = [];
let commands: [string, Type.PluginOnCommand][] = [];
const onmessages: Type.PluginOnMessage[] = [];

for (const file of fs.readdirSync('./js/plugins/')) {
	if (/\.js$/.test(file)) {
		try {
			const plugin: Type.IPlugin = require('../plugins/' + file);
			if (typeof plugin.onMessage === 'function') {
				onmessages.push(plugin.onMessage);
			}
			if (plugin?.data?.command && plugin?.onCommand) {
				for (const cmd of plugin.data.command) {
					commands.push([cmd, plugin.onCommand]);
				}
				pluginsData.push(plugin.data);
			}
		} catch (e) {
			logger.info(e);
		}
	}
}

commands = commands.sort((a, b) => b[0].length - a[0].length);

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

	for (const onmessage of onmessages) {
		onmessage(new methods.Wrapper(conn, message, DB, DBChats, DBUsers, DBSystem));
	}

	if (DBUsers[message.sender!]?.pending?.[message.rjid!]?.blockCommand) return;

	let prefix = '/';
	if (message.rjid && typeof DBChats[message.rjid]?.prefix === 'string')
		prefix = DBChats[message.rjid].prefix.toLowerCase();

	let userCommands: string[] | undefined;
	if (message.rjid && message.text) {
		if (!methods.isGroup({ message: { rjid: message.rjid } } as methods.Wrapper)) {
			userCommands = methods.parseCommand(
				message.text,
				prefix,
				botNumber,
				conn.user.name || 'bot'
			);
		} else if (message._quotedsender && message._quotedsender === botNumber) {
			userCommands = methods.parseCommand(
				message.text,
				prefix,
				botNumber,
				conn.user.name || 'bot'
			);
		} else if (message.text.startsWith(prefix)) {
			userCommands = methods.parseCommand(
				message.text,
				prefix,
				botNumber,
				conn.user.name || 'bot'
			);
		} else if (
			message.mentioned?.includes?.(botNumber) ||
			new RegExp('^\\W*@' + _.escapeRegExp(conn.user.name || 'bot')).test(message.text)
		) {
			userCommands = methods.parseCommand(
				message.text,
				prefix,
				botNumber,
				conn.user.name || 'bot'
			);
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

	if (userCommands?.length) {
		for (const userCommand of userCommands) {
			for (const [command, onCommand] of commands) {
				const theCommand = testCommand(command, userCommand);
				if (theCommand) {
					logger.info(`Executing "${theCommand}" command...`);
					if (typeof onCommand === 'function') {
						const $ = new methods.Wrapper(
							conn,
							message,
							DB,
							DBChats,
							DBUsers,
							DBSystem,
							userCommand,
							theCommand,
							getArgument(theCommand, userCommand)
						) as Required<methods.Wrapper>;
						try {
							await onCommand($);
						} catch (e) {
							logger.error(e);
							methods.sendText($, $.texts.TEXT_ERROR);
						}
						break;
					}
				}
			}
		}
	}
}

function testCommand(command: string, text: string) {
	if (new RegExp(`^\\W*${_.escapeRegExp(command).split(' ').join('\\W*')}\\b`, 'i').test(text))
		return command;
	return false;
}

function getArgument(command: string, text: string) {
	return text.replace(
		new RegExp(`^\\W*${_.escapeRegExp(command).split(' ').join('\\W*')}\\b`, 'i'),
		''
	);
}
