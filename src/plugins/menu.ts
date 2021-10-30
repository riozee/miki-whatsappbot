import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import { pluginsData } from '../handlers/handler';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const list: { [k: string]: string[] } = {};
	for (const { command: commands, category } of pluginsData) {
		if (!list[category]) list[category] = [];
		for (const command of commands) {
			list[category].push(command);
		}
	}

	let str = '';
	for (const cat in list) {
		str += `*${cat.toUpperCase()}*\n`;
		for (const name of list[cat]) {
			str += ` · ${name}\n`;
		}
		str += '\n';
	}

	__.sendText($, str.trim());
};

export const data: Type.PluginData = {
	command: ['menu', 'start', 'help'],
	category: 'bot',
};
