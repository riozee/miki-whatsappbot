import * as Type from '../@types/types';
import got from 'got';
import * as fs from 'fs';
import * as Baileys from '@adiwajshing/baileys';
import * as constants from '../utils/constants';
import * as logger from '../utils/logger';
import _ from 'lodash';
const fileType = require('file-type');

/**
 * Wraps the entire universe
 */
export class Wrapper {
	texts: { [k: string]: string };
	constructor(
		public conn: Baileys.WAConnection,
		public message: Type.IMessage,
		public DB: Type.DB,
		public DBChats: any,
		public DBUsers: any,
		public DBSystem: any,
		public text?: string,
		public command?: string,
		public argument?: string
	) {
		this.texts =
			constants.TEXTS[getLanguage({ message: this.message, DBChats: this.DBChats } as Wrapper)];
	}
}

export async function checkInternetConnection() {
	try {
		await got('http://www.google.com/', {
			retry: 0,
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * If a text is considered a command, clean the text here to be executed.
 * Remove the leading prefix and/or mention to the bot.
 * Returns one or multi-command if "|>" is found.
 */
export function parseCommand(text: string, prefix: string, botNumber: string, botName: string) {
	text = text.trimStart();
	if (text.startsWith(prefix)) text = text.replace(new RegExp(`^${_.escapeRegExp(prefix)}`), '');
	if (new RegExp('^\\W*@' + trimId(botNumber)).test(text))
		text = text.replace(new RegExp('^\\W*@' + trimId(botNumber)), '');
	else if (new RegExp('^\\W*@' + _.escapeRegExp(botName)).test(text))
		text = text.replace(new RegExp('^\\W*@' + _.escapeRegExp(botName)), '');
	const parsed = text.split(/\|>/g).map((text) => text.trimStart());
	return parsed;
}

/**
 * Pauses the program
 */
export function pause(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * Get the language of current chat
 *
 * @default id
 */
export function getLanguage($: Wrapper) {
	if (!$.message.rjid) return 'id';
	else if (!$.DBChats[$.message.rjid]?.language) return 'id';
	else return $.DBChats[$.message.rjid].language as string;
}

export function randomFileName() {
	// yes, it's not random
	return `${Date.now()}-${process.hrtime()[1]}`;
}

function saveFile(data: Buffer, path: string, fileExtension?: string) {
	const id = randomFileName();
	let filetype;
	if (!fileExtension) filetype = fileType(data);
	if (fileExtension) fileExtension = fileExtension.toLowerCase().replace(/^\./, '');
	const fileName =
		id + (fileExtension ? `.${fileExtension}` : filetype?.ext ? `.${filetype.ext}` : '');
	return new Promise<string>((resolve, reject) => {
		fs.writeFile(path + fileName, data, (error) => {
			if (error) {
				logger.error('Error while saving', data.length, 'bytes to', path + fileName);
				reject(error);
			}
			resolve(path + fileName);
		});
	});
}

/**
 * Save file to `./tmp/` folder
 */
export async function saveFileToTmp(data: Buffer, fileExtension?: string) {
	return await saveFile(data, './tmp/', fileExtension);
}

/**
 * Save file to `./data/media/` folder
 */
export async function saveFileToData(data: Buffer, fileExtension?: string) {
	return await saveFile(data, './data/media', fileExtension);
}

// BROKEN LOL
// /**
//  * Find the corresponding language code from a language name.
//  * If could not find the language code from languageList, it will uses
//  * the iso-language-codes library to find the language code.
//  *
//  * @param {string} text - the language name
//  * @param {Object} languageList - a key-value of language code and language name dictionary
//  */
// export function guessLanguageCode(text: string, languageList: { [k: string]: string }) {
// 	const lwrText = text.toLowerCase();
// 	const firstGuess = Object.values(languageList).indexOf(lwrText);
// 	if (firstGuess !== -1) {
// 		const res = Object.keys(languageList)[firstGuess];
// 		logger.debug('GUESS LANGUAGE CODE', lwrText, 'IS', res, 'IN 1ST GUESS');
// 		return res;
// 	}
// 	const secondGuess = languageCodes.map((lang) => lang.name).indexOf(lwrText);
// 	if (secondGuess !== -1) {
// 		const res = languageCodes[secondGuess].iso639_1;
// 		logger.debug('GUESS LANGUAGE CODE', lwrText, 'IS', res, 'IN 2ND GUESS');
// 		return res;
// 	}
// 	const thirdGuess = languageCodes
// 		.map((lang) => lang.nativeName.split(/[,\s]+/g))
// 		.findIndex((lang) => lang.includes(lwrText));
// 	if (thirdGuess !== -1) {
// 		const res = languageCodes[thirdGuess].iso639_1;
// 		logger.debug('GUESS LANGUAGE CODE', lwrText, 'IS', res, 'IN 3RD GUESS');
// 		return res;
// 	}
// 	return;
// }

/**
 * jid/gid is in the format `number@suffix`, use this to cut the suffix.
 */
export function trimId(id: string) {
	return id.split('@')[0];
}

// WHAT IS JID/GID?
// I'm pretty sure `gid` is a group id.
// But I'm not quite sure for `jid` (it's a WhatsApp term).
// For what I know, `jid` is for user id.

export function isGroup(id: Wrapper) {
	if (id.message.rjid) {
		return id.message.rjid.endsWith('@g.us');
	} else {
		return;
	}
}

export async function isGroupAdmin($: Wrapper) {
	if (isOwner($)) return true; // bot is admin === owner is admin :vvvvvvvv
	const member = (await $.conn.groupMetadata($.message.rjid!)).participants.filter(
		(member) => member.jid === $.message.sender
	)[0];
	return member?.isAdmin || member?.isSuperAdmin;
}

export async function isBotGroupAdmin($: Wrapper) {
	const member = (await $.conn.groupMetadata($.message.rjid!)).participants.filter(
		(member) => member.jid === $.conn.user.jid
	)[0];
	return member?.isAdmin || member?.isSuperAdmin;
}

export function isOwner($: Wrapper) {
	return constants.OWNER_NUMBER.includes($.message.sender as string);
}

export function isMe($: Wrapper) {
	return $.message.sender === $.conn.user.jid;
}

export function isPremium($: Wrapper) {
	if (isOwner($)) return true;
	else if (isMe($)) return true;
	// TODO: weekly and monthly plan
	else if ($.DBUsers[$.message.sender!]?.premium) return true;
	else return false;
}

export function getWAUsername($: Wrapper, includeContactName = false, id?: string) {
	let sender = id ? id : ($.message.sender as string);
	if (!sender.endsWith(constants.JID_SUFFIX))
		sender = (trimId(sender) + constants.JID_SUFFIX) as string;
	if (sender === $.conn.user.jid) return $.conn.user.name || trimId(sender);
	else
		return (
			(includeContactName ? $.conn.contacts[sender]?.name : undefined) ||
			$.conn.contacts[sender]?.notify ||
			$.conn.contacts[sender]?.vname ||
			trimId(sender)
		);
}

export async function getGroupName($: Wrapper, id?: string) {
	let group = id ? id : $.message.rjid?.endsWith?.(constants.GID_SUFFIX) ? $.message.rjid : 0;
	if (!group) return trimId(group as string);
	else {
		try {
			return (await $.conn.groupMetadata(group as string)).subject;
		} catch {
			return trimId(group as string);
		}
	}
}

/**
 * Get the username (in the database).
 */
export function getUsername($: Wrapper) {
	if ($.DBUsers[$.message.sender!]?.username) return $.DBUsers[$.message.sender!]?.username as string;
	else return;
}

export function parseMentions(text: string) {
	const matches = text.match(constants.REGEX_MENTION);
	if (matches) {
		const mentioned: string[] = [];
		for (const match of matches) {
			mentioned.push((match.slice(1) + constants.JID_SUFFIX) as string);
		}
		return mentioned;
	} else return [];
}

/**
 * @example
 * ```js
 * onCommand = (...a) => {
 *   sendText('type 1 to continue');
 *   addWait($, 'some_command', Date.now());
 * }
 * onMessage = (...a) => {
 * 	 waitFor($, 'some_command', (choice) => {
 *     if (choice === 1) {
 *       sendText(`you answered in: ${(
 *         Date.now() - getWaitData($)
 *       )}ms`);
 *       clearWait($);
 *     }
 *   })
 * }
 * ```
 */
export function addWait($: Wrapper, name: string, data?: any, blockCommand = false) {
	const sender = $.message.sender;
	const rjid = $.message.rjid;
	$.DB.push(`/users/${sender}/pending/${rjid}`, {
		name: name,
		data: data,
		blockCommand: blockCommand,
		time: Date.now(),
	});
	setTimeout(() => {
		if ($.DBUsers[sender!]?.pending?.[rjid!]) {
			$.DB.delete(`/users/${sender}/pending/${rjid}`);
		}
	}, 3600000 * 3);
}

/**
 * @example
 * ```js
 * onCommand = (...a) => {
 *   sendText('type 1 to continue');
 *   addWait($, 'some_command', Date.now());
 * }
 * onMessage = (...a) => {
 * 	 waitFor($, 'some_command', (choice) => {
 *     if (choice === 1) {
 *       sendText(`you answered in: ${(
 *         Date.now() - getWaitData($)
 *       )}ms`);
 *       clearWait($);
 *     }
 *   })
 * }
 * ```
 */
export function waitFor(
	$: Wrapper,
	name: string,
	fn: (choice: number, done: () => void, cancel: () => void) => any
) {
	if ($.DBUsers[$.message.sender!]?.pending?.[$.message.rjid!]?.name === name) {
		let text = $.message.text ? $.message.text : '';
		if ($.message.mentioned?.length) {
			for (const mention of $.message.mentioned) {
				// a mention is an @ followed by numbers
				// if not replaced, the `choice` will be that number
				text = text.replace(new RegExp('@' + trimId(mention), 'g'), '');
			}
		}
		const choice = $.message.text ? parseInt(text) : NaN;
		function done() {
			clearWait($);
			return sendText($, $.texts.OPERATION_COMMAND_DONE);
		}
		function cancel() {
			clearWait($);
			return sendText($, $.texts.OPERATION_COMMAND_CANCELLED);
		}
		fn(choice, done, cancel);
	}
}

/**
 * @example
 * ```js
 * onCommand = (...a) => {
 *   sendText('type 1 to continue');
 *   addWait($, 'some_command', Date.now());
 * }
 * onMessage = (...a) => {
 * 	 waitFor($, 'some_command', (choice) => {
 *     if (choice === 1) {
 *       sendText(`you answered in: ${(
 *         Date.now() - getWaitData($)
 *       )}ms`);
 *       clearWait($);
 *     }
 *   })
 * }
 * ```
 */
export function clearWait($: Wrapper) {
	$.DB.delete(`/users/${$.message.sender}/pending/${$.message.rjid}`);
}

/**
 * @example
 * ```js
 * onCommand = (...a) => {
 *   sendText('type 1 to continue');
 *   addWait($, 'some_command', Date.now());
 * }
 * onMessage = (...a) => {
 * 	 waitFor($, 'some_command', (choice) => {
 *     if (choice === 1) {
 *       sendText(`you answered in: ${(
 *         Date.now() - getWaitData($)
 *       )}ms`);
 *       clearWait($);
 *     }
 *   })
 * }
 * ```
 */
export function getWaitData($: Wrapper) {
	if ($.DBUsers[$.message.sender!]?.pending?.[$.message.rjid!]?.data)
		return $.DBUsers[$.message.sender!].pending[$.message.rjid!].data;
}

/**
 * Function to change the text before being sent.
 */
export async function prepareText($: Wrapper, text: any[]) {
	return text.join('\n\n');
	// const _isPremium = isPremium($);
	// if (_isPremium) return text.join('\n\n');
	// else {
	// 	return (
	// 		text.join('\n\n') +
	// 		'\n\n' +
	// 		$.texts.TEXT_MESSAGE_FOOTER.replace('%name', constants.BOT_NAME).replace(
	// 			'%number',
	// 			trimId($.conn.user.jid)
	// 		)
	// 	);
	// }
}

export function monospace(text: string) {
	return '```' + text + '```';
}

type perm = 'group' | 'admin' | 'botadmin';
/**
 * Check if a user is able to run the command
 */
export async function check($: Wrapper, ...permissions: perm[]) {
	for (const perm of permissions) {
		switch (perm) {
			case 'group':
				if (!isGroup($)) return perm;
				continue;
			case 'admin':
				if (!(await isGroupAdmin($))) return perm;
				continue;
			case 'botadmin':
				if (!(await isBotGroupAdmin($))) return perm;
				continue;
			default:
				continue;
		}
	}
	return false;
}

///////////////////
// SENDING MESSAGES
///////////////////

export function getOptions($: Wrapper, text?: string): Baileys.MessageOptions {
	return {
		quoted: $.message.json,
		sendEphemeral: true,
		contextInfo: {
			// @ts-ignore
			mentionedJid: text ? [...parseMentions(text), $.message.sender] : [$.message.sender],
		},
	};
}

/**
 * Send text reply message.
 *
 * @see {@link Baileys.WAConnection.sendMessage}
 */
export async function sendText($: Wrapper, value: any, options?: Baileys.MessageOptions) {
	const text = String(value);
	if (!options) options = getOptions($, text);
	return $.conn.sendMessage($.message.rjid!, text, Baileys.MessageType.extendedText, options);
}

/**
 * Send image reply message.
 *
 * @param data - a string of URL or file path, or a Buffer of image data
 * @see {@link Baileys.WAConnection.sendMessage}
 */
export async function sendImage(
	$: Wrapper,
	data: string | Buffer,
	caption?: any,
	options?: Baileys.MessageOptions
) {
	const text = String(caption || '');
	if (!options) options = getOptions($, text);
	options.caption = text;
	return $.conn.sendMessage(
		$.message.rjid!,
		Buffer.isBuffer(data) ? data : { url: data },
		Baileys.MessageType.image,
		options
	);
}

/**
 * Send sticker reply message.
 *
 * @param data - a string of URL or file path, or a Buffer of sticker image data
 * @see {@link Baileys.WAConnection.sendMessage}
 */
export async function sendSticker($: Wrapper, data: string | Buffer, options?: Baileys.MessageOptions) {
	if (!options) options = getOptions($);
	return $.conn.sendMessage(
		$.message.rjid!,
		Buffer.isBuffer(data) ? data : { url: data },
		Baileys.MessageType.sticker,
		options
	);
}

/**
 * Send buttons reply message.
 *
 * @see {@link Baileys.WAConnection.sendMessage}
 */
export async function sendButtons(
	$: Wrapper,
	buttons: Baileys.WAMessageProto.IButton[],
	contentText: string,
	footerText: string,
	headerType: Baileys.proto.ButtonsMessage.ButtonsMessageHeaderType,
	headerMessage: {
		documentMessage?: Baileys.proto.IDocumentMessage;
		imageMessage?: Baileys.proto.IImageMessage;
		videoMessage?: Baileys.proto.IVideoMessage;
		locationMessage?: Baileys.proto.ILocationMessage;
	},
	options?: Baileys.MessageOptions
) {
	if (!options) options = getOptions($);
	return $.conn.sendMessage(
		$.message.rjid!,
		// @ts-ignore
		{
			buttons: buttons,
			contentText: contentText,
			footerText: footerText,
			headerType: headerType,
			...headerMessage,
		},
		Baileys.MessageType.buttonsMessage,
		options
	);
}

/**
 * Send group invite message.
 * Bot must be an admin in the given group id.
 *
 * @see {@link Baileys.WAConnection.sendMessage}
 */
export async function sendGroupInvite(
	$: Wrapper,
	toJid: string,
	gid: string,
	caption: string,
	options?: Baileys.MessageOptions
) {
	if (!options) options = getOptions($, caption);
	const groupName = await getGroupName($, gid);
	const inviteCode = await $.conn.groupInviteCode(gid);
	let jpegThumbnail;
	try {
		jpegThumbnail = await got(await $.conn.getProfilePicture(gid)).buffer();
	} catch (e) {
		logger.error(e);
	}
	return $.conn.sendMessage(
		toJid,
		{
			caption: caption,
			groupJid: gid,
			groupName: groupName,
			inviteCode: inviteCode,
			inviteExpiration: 86400000,
			// @ts-ignore
			jpegThumbnail: jpegThumbnail,
		},
		Baileys.MessageType.groupInviteMessage,
		options
	);
}
