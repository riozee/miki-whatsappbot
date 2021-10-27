import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	let check;
	if (__.isGroup($)) {
		check = await __.check($, 'admin');
	} else {
		check = false;
	}
	if (check) {
		if ($.DBChats[$.message.rjid!]?.muted) {
			return;
		} else {
			return __.sendText($, $.texts['PERMISSION_COMMAND_' + (check as string).toUpperCase()]);
		}
	} else {
		if ($.DBChats[$.message.rjid!]?.muted) {
			if ($.command === 'unmute bot') {
				$.DB.delete(`/chats/${$.message.rjid}/muted`);
				return __.sendText($, $.texts.COMMAND_MUTEBOT_UNMUTE);
			} else {
				return __.sendText($, $.texts.COMMAND_MUTEBOT_ALREADY);
			}
		} else {
			if ($.command === 'unmute bot') {
				return __.sendText($, $.texts.COMMAND_MUTEBOT_UNMUTE_ALREADY);
			} else {
				$.DB.push(`/chats/${$.message.rjid}/muted`, true);
				return __.sendText($, $.texts.COMMAND_MUTEBOT_MUTE);
			}
		}
	}
};

export const data: Type.PluginData = {
	command: ['mute bot', 'unmute bot'],
	category: 'bot',
};
