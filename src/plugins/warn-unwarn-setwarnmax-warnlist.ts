import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import _ from 'lodash';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const check = await __.check($, 'group', 'admin');
	if (check) {
		return __.sendText($, $.texts['PERMISSION_COMMAND_' + check.toUpperCase()]);
	}

	if ($.command === 'set warn max') {
		const point = +$.argument;
		if (isNaN(point)) {
			return __.sendText($, $.texts.COMMAND_SETMAXWARN_NOARGUMENT);
		} else if (point > 2) {
			$.DB.push(`/chats/${$.message.rjid}/warn/max`, point);
			return __.sendText($, $.texts.COMMAND_SETMAXWARN_SUCCESS.replace(/%point/g, String(point)));
		} else {
			return __.sendText($, $.texts.COMMAND_SETMAXWARN_MINIMUM);
		}
	}

	const maxPoint: number = $.DBChats[$.message.rjid!]?.warn?.max || 3;
	if ($.command === 'warn list') {
		const data: { [k: string]: number } = $.DBChats[$.message.rjid!]?.warn;
		return __.sendText(
			$,
			$.texts.COMMAND_WARNLIST_TEXT.replace(
				/%list/g,
				Object.entries(data)
					.filter((v) => v[0] !== 'max')
					.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
					.join('\n')
			)
		);
	}

	const results: { [k: string]: number | null } = {};
	if ($.command === 'warn') {
		if ($.message.mentioned?.length) {
			for (const number of $.message.mentioned) {
				const currentPoint: number = $.DBChats[$.message.rjid!]?.warn?.[number] || 0;
				if (currentPoint + 1 < maxPoint) {
					$.DB.push(`/chats/${$.message.rjid}/warn/${number}`, currentPoint + 1);
					results[number] = currentPoint + 1;
				} else {
					results[number] = null;
				}
				if (!__.isPremium($) && $.message.mentioned?.length > 1) {
					await __.sendText($, $.texts.COMMAND_WARN_NONPREMIUM);
					break;
				}
			}
			const havePoint = Object.entries(results).filter((v) => v[1] !== null);
			const nullPoint = Object.entries(results).filter((v) => v[1] === null);
			if (havePoint.length) {
				await __.sendText(
					$,
					$.texts.COMMAND_WARN_SUCCESS.replace(
						/%list/g,
						havePoint
							.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
							.join('\n')
					)
				);
			}
			if (nullPoint.length) {
				if (await __.isBotGroupAdmin($)) {
					await __.sendText(
						$,
						$.texts.COMMAND_WARN_KICK.replace(
							/%list/g,
							nullPoint
								.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
								.join('\n')
						)
					);
					for (const [number] of nullPoint) {
						try {
							await $.conn.groupRemove($.message.rjid!, [number]);
							await __.pause(_.random(200, 2000));
						} catch (e) {
							await __.sendText(
								$,
								$.texts.COMMAND_KICK_FAILED.replace(/%numbers/g, '@' + __.trimId(number))
							);
							await __.pause(_.random(200, 2000));
						}
					}
				} else {
					await __.sendText(
						$,
						$.texts.COMMAND_WARN_NOTADMIN.replace(
							/%list/g,
							nullPoint
								.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
								.join('\n')
						)
					);
				}
			}
			return;
		} else {
			return __.sendText($, $.texts.COMMAND_WARN_NOARGUMENT);
		}
	} else {
		if ($.message.mentioned?.length) {
			for (const number of $.message.mentioned) {
				const currentPoint: number = $.DBChats[$.message.rjid!]?.warn?.[number] || 0;
				if (currentPoint > 0) {
					if (currentPoint - 1 === 0) {
						$.DB.delete(`/chats/${$.message.rjid}/warn/${number}`);
					} else {
						$.DB.push(`/chats/${$.message.rjid}/warn/${number}`, currentPoint - 1);
					}
					results[number] = currentPoint - 1;
				} else {
					results[number] = null;
				}
				if (!__.isPremium($) && $.message.mentioned?.length > 1) {
					await __.sendText($, $.texts.COMMAND_UNWARN_NONPREMIUM);
					break;
				}
			}
			const havePoint = Object.entries(results).filter((v) => v[1] !== null);
			const nullPoint = Object.entries(results).filter((v) => v[1] === null);
			if (havePoint.length) {
				await __.sendText(
					$,
					$.texts.COMMAND_UNWARN_SUCCESS.replace(
						/%list/g,
						havePoint
							.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
							.join('\n')
					)
				);
			}
			if (nullPoint.length) {
				await __.sendText(
					$,
					$.texts.COMMAND_UNWARN_MINIMUM.replace(
						/%list/g,
						nullPoint
							.map((v, i) => `${i + 1}. @${__.trimId(v[0])} *[${v[1]}/${maxPoint}]*`)
							.join('\n')
					)
				);
			}
			return;
		} else {
			return __.sendText($, $.texts.COMMAND_UNWARN_NOARGUMENT);
		}
	}
};

export const data: Type.PluginData = {
	command: ['warn', 'unwarn', 'set warn max', 'warn list'],
	category: 'group management',
};
