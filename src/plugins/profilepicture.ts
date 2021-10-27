import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	const numbers = $.argument
		.split(/[^\s\d\+\-\.\(\)]+/g)
		.map((n) => n.replace(/\D+/g, ''))
		.filter(Boolean);
	if (numbers.length) {
		const result = {
			notInWa: [] as string[],
			fail: [] as string[],
			noPp: [] as string[],
		};
		for (const number of numbers) {
			if (await $.conn.isOnWhatsApp(number)) {
				let ppLink: string | undefined;
				try {
					if (number + constants.JID_SUFFIX === $.conn.user.jid) {
						ppLink = $.conn.user.imgUrl;
					} else {
						ppLink = await $.conn.getProfilePicture(number + constants.JID_SUFFIX);
					}
					if (ppLink) {
						await __.sendImage(
							$,
							ppLink,
							$.texts.COMMAND_PROFILEPICTURE_TEXT.replace(/%number/g, number)
						);
					} else {
						result.noPp.push(number);
					}
				} catch (e) {
					logger.error(e);
					result.fail.push(number);
				}
			} else {
				result.notInWa.push(number);
			}
			if (!__.isPremium($)) {
				await __.sendText($, $.texts.COMMAND_PROFILEPICTURE_NONPREMIUM);
				break;
			}
		}
		if (result.fail.length) {
			await __.sendText(
				$,
				$.texts.COMMAND_PROFILEPICTURE_FAIL.replace(
					/%numbers/g,
					result.fail.map((n) => '@' + n).join(', ')
				)
			);
		}
		if (result.noPp.length) {
			await __.sendText(
				$,
				$.texts.COMMAND_PROFILEPICTURE_NOPP.replace(
					/%numbers/g,
					result.noPp.map((n) => '@' + n).join(', ')
				)
			);
		}
		if (result.notInWa.length) {
			await __.sendText(
				$,
				$.texts.COMMAND_PROFILEPICTURE_NOTINWA.replace(/%numbers/g, result.notInWa.join(', '))
			);
		}
		return;
	} else {
		return __.sendText($, $.texts.COMMAND_PROFILEPICTURE_NOARGUMENT);
	}
};

export const data: Type.PluginData = {
	command: ['pp', 'profile picture'],
	category: 'tools',
};
