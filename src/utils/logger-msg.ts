/**
 * @utils/logger-msg.ts
 *
 * Function to log the Message to the console
 */

import * as methods from '../utils/methods';
import * as Baileys from '@adiwajshing/baileys';
import * as Type from '../@types/types';
import * as logger from '../utils/logger';
import moment from 'moment';
import chalk from 'chalk';
import _ from 'lodash';

const tmp: { [k: string]: [number, number, number] } = {};
export async function message(conn: Baileys.WAConnection, message: Type.IMessage) {
	// [timestamp] messageType from ~user in @group
	// message...
	if (!message.json) return;
	console.log(
		// timestamp
		chalk.hsv(
			100,
			100,
			100
		)(
			`[${(message.json.messageTimestamp
				? moment(Number(message.json.messageTimestamp) * 1000)
				: moment()
			).format('D/MM,HH:mm:ss')}]`
		),
		// messageType
		message.json.messageStubType
			? chalk.yellow(Baileys.WA_MESSAGE_STUB_TYPES[message.json.messageStubType])
			: chalk.yellow(message.mtype) || 'unknown',
		// from ~user |or| messageStubParameters
		message.json.messageStubType
			? message.json.messageStubParameters.length
				? `[${message.json.messageStubParameters.join(',')}]`
				: ''
			: `from ${await (async () => {
					if (!message.sender) return 'unknown';
					if (!tmp[message.sender])
						tmp[message.sender] = [_.random(0, 360), _.random(0, 75), 100];
					return chalk.hsv(...tmp[message.sender])(
						'~' +
							(await methods.getWAUsername(
								{ message, conn } as methods.Wrapper,
								true,
								message.sender
							))
					);
			  })()}`,
		// in @group
		message.sender !== message.rjid
			? `in ${await (async () => {
					if (!message.rjid) return 'unknown';
					if (!tmp[message.rjid]) tmp[message.rjid] = [_.random(0, 360), _.random(0, 75), 100];
					return chalk.hsv(...tmp[message.rjid])(
						'@' +
							(await methods.getGroupName(
								{ message, conn } as methods.Wrapper,
								message.rjid
							))
					);
			  })()}`
			: '',
		// message
		(() => {
			if (!message.text) return '\n';
			const text = message.text.replace(/\n+/g, '  ');
			if (text.length > Number(process.stdout.columns) * 2)
				return `\n${text.slice(0, Number(process.stdout.columns) * 2 - 5)} ...\n`;
			return `\n${text}\n`;
		})(),
		//debug
		logger.debug(message) || ''
	);
}
