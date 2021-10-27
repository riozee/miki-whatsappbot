import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import _ from 'lodash';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	if ($.texts.COMMAND_APAKAH_TEXT) {
		if ($.argument.trim()) {
			__.sendText(
				$,
				$.texts.COMMAND_APAKAH_TEXT.replace(/%question/g, $.argument + '?').replace(
					/%answer/g,
					_.sample($.texts.COMMAND_APAKAH_ANSWERS.split('\n')) as string
				)
			);
		} else {
			__.sendText($, $.texts.COMMAND_APAKAH_NOARGUMENT);
		}
	} else {
		__.sendText($, $.texts.TEXT_UNSUPPORTED_LANGUAGE);
	}
};

export const data: Type.PluginData = {
	command: ['apa', 'apakah'],
	category: 'fun',
};
