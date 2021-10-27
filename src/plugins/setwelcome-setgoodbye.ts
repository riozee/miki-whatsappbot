import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const check = await __.check($, 'group', 'admin');
	if (check) {
		return await __.sendText($, $.texts['PERMISSION_COMMAND_' + check.toUpperCase()]);
	}

	const SET = $.command.replace(' ', '').toUpperCase();
	const command = $.command.split(' ')[1] as 'welcome' | 'goodbye';
	if ($.argument) {
		if (/^\W*on\W*$/i.test($.argument)) {
			$.DB.push(`/chats/${$.message.rjid}/${command}[0]`, true);
			return __.sendText($, $.texts[`COMMAND_${SET}_ON`]);
		} else if (/^\W*off\W*$/i.test($.argument)) {
			$.DB.push(`/chats/${$.message.rjid}/${command}[0]`, false);
			return __.sendText($, $.texts[`COMMAND_${SET}_OFF`]);
		} else if (/^\W*image\W*$/i.test($.argument)) {
			let media = null;
			if ($.message.mtype === 'imageMessage') {
				media = await $.conn.downloadMediaMessage($.message.json!);
			} else if ((await $.message.quoted($))?.mtype === 'imageMessage') {
				media = await $.conn.downloadMediaMessage((await $.message.quoted($))?.json!);
			}
			if (media) {
				const filename = await __.saveFileToData(media);
				$.DB.push(`/chats/${$.message.rjid}/${command}[2]`, filename);
				return __.sendText($, $.texts[`COMMAND_${SET}_IMAGE`]);
			} else {
				return __.sendText($, $.texts.TEXT_NOIMAGE);
			}
		} else if (/^\W*text\W*/i.test($.argument)) {
			const text = $.argument.replace(/^\W*text/i, '');
			if (text.trim()) {
				$.DB.push(`/chats/${$.message.rjid}/${command}[1]`, text);
				return __.sendText($, $.texts[`COMMAND_${SET}_TEXT`]);
			} else {
				return __.sendText($, $.texts[`COMMAND_${SET}_NOARGUMENT`]);
			}
		} else if (/^\W*preview\W*$/i.test($.argument)) {
			return send($, command, [$.message.sender!]);
		} else {
			return __.sendText($, $.texts[`COMMAND_${SET}_NOARGUMENT`]);
		}
	} else {
		return __.sendText($, $.texts[`COMMAND_${SET}_NOARGUMENT`]);
	}
};

export const onMessage: Type.PluginOnMessage = ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	if ($.DBChats[$.message.rjid!]?.welcome?.[0] || $.DBChats[$.message.rjid!]?.goodbye?.[0]) {
		/**
		 * @see https://adiwajshing.github.io/Baileys/enums/proto.webmessageinfo.webmessageinfostubtype.html
		 */
		if ($.message.json?.messageStubType) {
			if (
				$.message.json.messageStubType === 27 || // GROUP_PARTICIPANT_ADD
				$.message.json.messageStubType === 31 // GROUP_PARTICIPANT_INVITE
			) {
				if ($.message.json.messageStubParameters.length) {
					if ($.message.json.messageStubParameters.includes($.conn.user.jid)) {
						return;
					} else {
						return send($, 'welcome', $.message.json.messageStubParameters);
					}
				} else {
					return;
				}
			} else if (
				$.message.json.messageStubType === 32 || // GROUP_PARTICIPANT_LEAVE
				$.message.json.messageStubType === 28 // GROUP_PARTICIPANT_REMOVE
			) {
				if ($.message.json.messageStubParameters.length) {
					if ($.message.json.messageStubParameters.includes($.conn.user.jid)) {
						return;
					} else {
						return send($, 'goodbye', $.message.json.messageStubParameters);
					}
				} else {
					return;
				}
			} else {
				return;
			}
		} else {
			return;
		}
	} else {
		return;
	}
};

export const data: Type.PluginData = {
	command: ['set welcome', 'set goodbye'],
	category: 'group management',
};

async function send($: Type.Wrapper, type: 'welcome' | 'goodbye', mention: string[]) {
	const [state, text, image] = ($.DBChats[$.message.rjid!]?.[type] || []) as [boolean, string, string];
	if (state) {
		const group = await $.conn.groupMetadata($.message.rjid!);
		if (image) {
			return __.sendImage(
				$,
				'./data/media' + image,
				(text ? text : $.texts.TEXT_WELCOME_DEFAULT)
					.replace(/@user/gi, mention.map((n) => '@' + __.trimId(n)).join(' '))
					.replace(/@group/gi, group.subject)
					.replace(/@desc/gi, group.desc || ''),
				{}
			);
		} else {
			return __.sendText(
				$,
				(text ? text : $.texts.TEXT_WELCOME_DEFAULT)
					.replace(/@user/gi, mention.map((n) => '@' + __.trimId(n)).join(' '))
					.replace(/@group/gi, group.subject)
					.replace(/@desc/gi, group.desc || ''),
				{}
			);
		}
	}
	return;
}
