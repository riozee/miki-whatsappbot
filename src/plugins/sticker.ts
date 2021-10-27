import type * as Type from '../@types/types';
import * as __ from '../utils/methods';
import * as logger from '../utils/logger';
import * as constants from '../utils/constants';
import fs from 'fs';
import { exec } from 'child_process';

const supportedMimeTypes: string[][] = [
	['image/jpeg', 'jpg'],
	['image/png', 'png'],
	['image/gif', 'gif'],
	['video/mp4', 'mp4'],
	['image/webp', 'webp'],
	['video/mpeg', 'mpeg'],
	['video/x-msvideo', 'avi'],
	['video/ogg', 'ogv'],
	['video/webm', 'webm'],
	['video/3gpp', '3gp'],
];

export const onCommand: Type.PluginOnCommand = async ($) => {
	if ($.DBChats[$.message.rjid!]?.muted) return;

	if (
		$.message.mtype === 'imageMessage' ||
		$.message.mtype === 'videoMessage' ||
		$.message.mtype === 'documentMessage'
	) {
		return _($.message);
	} else {
		const qMessage = await $.message.quoted($);
		if (qMessage) {
			if (
				qMessage.mtype === 'imageMessage' ||
				qMessage.mtype === 'videoMessage' ||
				qMessage.mtype === 'documentMessage'
			) {
				return _(qMessage);
			} else {
				return __.sendText($, $.texts.COMMAND_STICKER_NOMEDIA);
			}
		} else {
			return __.sendText($, $.texts.COMMAND_STICKER_NOMEDIA);
		}
	}

	async function _(message: Type.IMessage) {
		if (message.mtype === 'documentMessage') {
			if (
				!supportedMimeTypes
					.map((v) => v[0])
					.includes($.message.json?.message?.documentMessage?.mimetype!)
			) {
				return __.sendText($, $.texts.COMMAND_STICKER_DOCUMENT_UNSUPPORTED);
			}
		}
		const buffer = await $.conn.downloadMediaMessage(message.json!);
		const file = await __.saveFileToTmp(
			buffer,
			message.mtype === 'videoMessage'
				? 'mp4'
				: message.mtype === 'documentMessage'
				? supportedMimeTypes.filter(
						(v) => v[0] === message.json?.message?.documentMessage?.mimetype!
				  )[0][1]
				: 'jpg'
		);
		const isPremium = __.isPremium($);
		let pack = isPremium ? $.argument.trim() : '';
		if (!isPremium && pack) {
			__.sendText($, $.texts.COMMAND_STICKER_NONPREMIUM.replace(/%name/g, pack));
			pack = '';
		}
		const exifFile = generateStickerExif(pack, '');
		const output = `./tmp/${__.randomFileName()}.webp`;
		await makeSticker(file, output, exifFile);
		return __.sendSticker($, output);
	}
};

export const data: Type.PluginData = {
	command: ['s', 'sticker', 'stiker'],
	category: 'tools',
};

export function makeSticker(input: string, output: string, exif?: string) {
	return new Promise<void>((resolve, reject) => {
		exec(
			`ffmpeg -i ${input} -vcodec libwebp -compression_level 6 -q:v 25 -b:v 200k -vf "scale='if(gt(a,1),520,-1)':'if(gt(a,1),-1,520)':flags=lanczos:force_original_aspect_ratio=decrease,format=bgra,pad=520:520:-1:-1:color=#00000000,setsar=1" ${output}`,
			(error) => {
				if (error) return reject(error);
				if (exif) {
					exec(`webpmux -set exif ${exif} ${output} -o ${output}`, (error) => {
						if (error) return reject(error);
						resolve();
					});
				} else {
					resolve();
				}
			}
		);
	});
}

export function generateStickerExif(pack?: string, author?: string) {
	// copied from https://github.com/Alensaito1/wa-sticker-formatter
	let exifFile: string | undefined;
	try {
		(() => {
			const json = {
				'sticker-pack-id':
					'com.etheral.waifuhub.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2',
				'sticker-pack-name': pack || constants.DEFAULT_STICKER_PACKNAME,
				'sticker-pack-publisher': author || constants.DEFAULT_STICKER_AUTHOR,
			};
			// @ts-ignore
			let length = new TextEncoder('utf-8').encode(JSON.stringify(json)).length;
			const f = Buffer.from([
				0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
			]);
			const code = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00];
			if (length > 256) {
				length = length - 256;
				code.unshift(0x01);
			} else {
				code.unshift(0x00);
			}
			const fff = Buffer.from(code);
			const ffff = Buffer.from(JSON.stringify(json), 'utf-8');
			let len;
			if (length < 16) {
				len = length.toString(16);
				len = '0' + length;
			} else {
				len = length.toString(16);
			}
			const ff = Buffer.from(len, 'hex');
			const buffer = Buffer.concat([f, ff, fff, ffff]);
			const filename = `./tmp/${__.randomFileName()}.exif`;
			fs.writeFileSync(filename, buffer);
			exifFile = filename;
		})();
	} catch (e) {
		logger.error(e);
	}
	return exifFile;
}
