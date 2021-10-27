import type * as Type from '../@types/types';
import * as methods from '../utils/methods';
import * as logger from '../utils/logger';
import * as Baileys from '@adiwajshing/baileys';
import * as constants from '../utils/constants';
constants;
logger;

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	if (methods.isOwner($) || methods.isMe($)) {
		let result,
			perf = process.hrtime();
		try {
			result = await eval($.argument);
		} catch (e) {
			result = e;
		} finally {
			perf = process.hrtime(perf);
			if (String(result) === '[object Object]') {
				try {
					result = JSON.stringify(result, null, '  ');
				} catch (e) {
					result = (e as Error).stack;
				}
			}
			return methods.sendText($, String(result));
		}

		function send(text: string, opts: any) {
			return $.conn.sendMessage(
				$.message.rjid!,
				String(text),
				Baileys.MessageType.text,
				opts || {}
			);
		}
	} else {
		return methods.sendText($, $.texts.PERMISSION_COMMAND_OWNER);
	}
};

export const data: Type.PluginData = {
	command: ['eval'],
	category: 'bot',
};
