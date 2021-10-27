import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	// ... //
};

export const onMessage: Type.PluginOnMessage = ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	// ... //
};

export const data: Type.PluginData = {
	command: ['template'],
	category: 'no category',
};
