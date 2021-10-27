import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import _ from 'lodash';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const check = await __.check($, 'group', 'admin', 'botadmin');
	if (check) {
		return await __.sendText($, $.texts['PERMISSION_COMMAND_' + check.toUpperCase()]);
	}
	if ($.message.mentioned?.length) {
		const adminList = (await $.conn.groupMetadata($.message.rjid!)).participants
			.filter((v) => v.isAdmin || v.isSuperAdmin)
			.map((v) => v.jid);
		const result = {
			success: [] as string[],
			fail: [] as string[],
			already: [] as string[],
		};
		for (const number of $.message.mentioned) {
			try {
				if ($.command === 'promote') {
					if (adminList.includes(number)) {
						result.already.push(number);
					} else {
						const response = await $.conn.groupMakeAdmin($.message.rjid!, [number]);
						// @ts-ignore
						if (response[__.trimId(number) + constants.UID_SUFFIX] == 200) {
							result.success.push(number);
						} else {
							result.fail.push(number);
						}
					}
				} else {
					if (!adminList.includes(number)) {
						result.already.push(number);
					} else {
						const response = await $.conn.groupDemoteAdmin($.message.rjid!, [number]);
						// @ts-ignore
						if (response[__.trimId(number) + constants.UID_SUFFIX] == 200) {
							result.success.push(number);
						} else {
							result.fail.push(number);
						}
					}
				}
				await __.pause(_.random(200, 2000));
			} catch (e) {
				logger.error(e);
				result.fail.push(number);
			}
			if (!__.isPremium($)) {
				if ($.command === 'promote') {
					await __.sendText($, $.texts.COMMAND_PROMOTE_NONPREMIUM);
				} else {
					await __.sendText($, $.texts.COMMAND_DEMOTE_NONPREMIUM);
				}
				break;
			}
		}
		if (result.success.length) {
			if ($.command === 'promote') {
				await __.sendText(
					$,
					$.texts.COMMAND_PROMOTE_SUCCESS.replace(
						/%numbers/g,
						result.success.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			} else {
				await __.sendText(
					$,
					$.texts.COMMAND_DEMOTE_SUCCESS.replace(
						/%numbers/g,
						result.success.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			}
		}
		if (result.fail.length) {
			if ($.command === 'promote') {
				await __.sendText(
					$,
					$.texts.COMMAND_PROMOTE_FAIL.replace(
						/%numbers/g,
						result.fail.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			} else {
				await __.sendText(
					$,
					$.texts.COMMAND_DEMOTE_FAIL.replace(
						/%numbers/g,
						result.fail.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			}
		}
		if (result.already.length) {
			if ($.command === 'promote') {
				await __.sendText(
					$,
					$.texts.COMMAND_PROMOTE_ALREADY.replace(
						/%numbers/g,
						result.already.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			} else {
				await __.sendText(
					$,
					$.texts.COMMAND_DEMOTE_ALREADY.replace(
						/%numbers/g,
						result.already.map((v) => '@' + __.trimId(v)).join(' ')
					)
				);
			}
		}
		return;
	} else {
		if ($.command === 'promote') {
			return __.sendText($, $.texts.COMMAND_PROMOTE_NOARGUMENT);
		} else {
			return __.sendText($, $.texts.COMMAND_DEMOTE_NOARGUMENT);
		}
	}
};

export const data: Type.PluginData = {
	command: ['promote', 'demote'],
	category: 'group management',
};
