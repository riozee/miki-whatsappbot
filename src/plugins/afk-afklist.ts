import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import moment from 'moment';
import _ from 'lodash';
type afk = [string, [string, number]];

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const check = await __.check($, 'group');
	if (check) {
		return await __.sendText($, $.texts['PERMISSION_COMMAND_' + check.toUpperCase()]);
	}

	if ($.command === 'afk list') {
		return await __.sendText(
			$,
			$.texts.COMMAND_AFK_LIST.replace(
				/%list/g,
				$.DBChats[$.message.rjid!]?.afk
					? (Object.entries($.DBChats[$.message.rjid!].afk) as afk[])
							.map(
								([jid, [reason, date]], i) =>
									`${i + 1}. ${__.getWAUsername($, false, jid)} [${moment(date).format(
										'hh:mm:ss A'
									)}] "${reason || '-'}"`
							)
							.join('\n') || '-'
					: '-'
			)
		);
	}

	$.DB.push(`/chats/${$.message.rjid}/afk/${$.message.sender}`, [$.argument, Date.now()]);
	return __.sendText(
		$,
		$.texts.COMMAND_AFK_AFK.replace(/%number/g, __.trimId($.message.sender!)).replace(
			/%reason/g,
			$.argument || '-'
		)
	);
};

export const onMessage: Type.PluginOnMessage = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	if ($.DBChats[$.message.rjid!]?.afk?.[$.message.sender!]) {
		const [reason, date] = $.DBChats[$.message.rjid!].afk[$.message.sender!];
		$.DB.delete(`/chats/${$.message.rjid}/afk/${$.message.sender}`);
		await __.sendText(
			$,
			$.texts.COMMAND_AFK_UNAFK.replace(/%date/g, moment(date).format('hh:mm:ss A')).replace(
				/%reason/g,
				reason || '-'
			)
		);
	}

	if ($.DBChats[$.message.rjid!]?.afk && ($.message.mentioned || $.message._quotedsender)) {
		const afks = Object.keys($.DBChats[$.message.rjid!].afk);
		if (afks.length) {
			const inafk = _.intersection(
				afks,
				_.uniq([...($.message.mentioned || []), $.message._quotedsender])
			) as string[];
			if (inafk.length) {
				for (const afk of inafk) {
					await __.sendText(
						$,
						$.texts.COMMAND_AFK_INAFK.replace(/%name/g, __.getWAUsername($, false, afk))
							.replace(
								/%date/g,
								moment($.DBChats[$.message.rjid!].afk[afk][1]).format('hh:mm:ss A')
							)
							.replace(/%reason/g, $.DBChats[$.message.rjid!].afk[afk][0] || '-')
					);
				}
			}
		}
	}
};

export const data: Type.PluginData = {
	command: ['afk', 'afk list'],
	category: 'group management',
};
