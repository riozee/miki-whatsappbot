import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	__.sendText(
		$,
		$.texts.COMMAND_PING_TEXT.replace(
			/%time/g,
			String(Date.now() - ($.message.json?.messageTimestamp as number) * 1000)
		)
	);
};

export const data: Type.PluginData = {
	command: ['ping'],
	category: 'bot',
};
