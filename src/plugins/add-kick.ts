import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import _ from 'lodash';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const check = await __.check($, 'group', 'admin', 'botadmin');
	if (check) {
		return __.sendText($, $.texts['PERMISSION_COMMAND_' + check.toUpperCase()]);
	} else {
		if ($.argument.replace(/\D+/g, '')) {
			const result = {
				invite: [] as string[],
				failed: [] as string[],
				notInWa: [] as string[],
				inGroup: [] as string[],
			};
			if ($.command === 'add') {
				const numbers = $.argument
					.split(/[^\s\d\+\-\.\(\)]+/g)
					.map((n) => n.replace(/\D+/g, ''))
					.filter(Boolean);
				const groupParticipants = (await $.conn.groupMetadata($.message.rjid!)).participants.map(
					(v) => __.trimId(v.jid)
				);
				for (const number of numbers) {
					try {
						if (groupParticipants.includes(number)) {
							result.inGroup.push(number);
						} else {
							const status = await $.conn.isOnWhatsApp(number);
							if (status?.exists && status?.jid) {
								const response = await $.conn.groupAdd($.message.rjid!, [status.jid]);
								if (
									// @ts-ignore
									response[__.trimId(status.jid) + constants.UID_SUFFIX] == 200
								) {
									await __.pause(_.random(200, 2000));
								} else {
									await __.sendGroupInvite(
										$,
										status.jid,
										$.message.rjid!,
										$.texts.COMMAND_ADD_INVITE_CAPTION.replace(
											/%number/g,
											__.trimId($.message.sender!)
										)
									);
									result.invite.push(number);
								}
							} else {
								result.notInWa.push(number);
							}
						}
					} catch (e) {
						logger.error(e);
						result.failed.push(number);
					}
					if (!__.isPremium($)) {
						if (numbers.length > 1) {
							await __.sendText($, $.texts.COMMAND_ADD_NONPREMIUM);
						}
						break;
					}
				}
				if (result.invite.length) {
					await __.sendText(
						$,
						$.texts.COMMAND_ADD_INVITE.replace(/%numbers/g, result.invite.join(', '))
					);
				}
				if (result.notInWa.length) {
					await __.sendText(
						$,
						$.texts.COMMAND_ADD_NOTINWA.replace(/%numbers/g, result.notInWa.join(', '))
					);
				}
				if (result.inGroup.length) {
					await __.sendText(
						$,
						$.texts.COMMAND_ADD_INGROUP.replace(
							/%numbers/g,
							result.inGroup.map((v) => `${v} (@${v})`).join(', ')
						)
					);
				}
				if (result.failed.length) {
					await __.sendText(
						$,
						$.texts.COMMAND_ADD_FAILED.replace(/%numbers/g, result.failed.join(', '))
					);
				}
				return;
			} else {
				if ($.message.mentioned?.length) {
					for (const number of $.message.mentioned) {
						try {
							const response = await $.conn.groupRemove($.message.rjid!, [number]);
							if (
								// @ts-ignore
								response[__.trimId(number) + constants.UID_SUFFIX] == 200
							) {
								await __.pause(_.random(200, 2000));
							} else {
								result.failed.push(number);
							}
						} catch (e) {
							logger.error(e);
							result.failed.push(number);
						}
						if (!__.isPremium($)) {
							if ($.message.mentioned.length > 1) {
								await __.sendText($, $.texts.COMMAND_KICK_NONPREMIUM);
							}
							break;
						}
					}
					if (result.failed.length) {
						await __.sendText(
							$,
							$.texts.COMMAND_KICK_FAILED.replace(/%numbers/g, result.failed.join(', '))
						);
					}
					return;
				} else {
					return await __.sendText($, $.texts.COMMAND_KICK_NOARGUMENT);
				}
			}
		} else {
			if ($.command === 'add') {
				return await __.sendText($, $.texts.COMMAND_ADD_NOARGUMENT);
			} else {
				return await __.sendText($, $.texts.COMMAND_KICK_NOARGUMENT);
			}
		}
	}
};

export const data: Type.PluginData = {
	command: ['add', 'kick'],
	category: 'group management',
};
