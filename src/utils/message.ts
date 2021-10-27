import * as Baileys from '@adiwajshing/baileys';
import * as methods from '../utils/methods';
import * as constants from './constants';
import * as logger from '../utils/logger';
import type * as Type from '../@types/types';
import _ from 'lodash';

/**
 * @see https://adiwajshing.github.io/Baileys/interfaces/wachat.html
 * @see https://adiwajshing.github.io/Baileys/classes/proto.webmessageinfo-1.html
 */
export class Message {
	json?: Baileys.WAMessageProto.WebMessageInfo;
	mtype?: keyof Baileys.proto.IMessage;
	text?: string;
	sender?: string | null;
	rjid?: string;
	mentioned?: string[];
	_quotedsender?: string;
	isEphemeralMessage?: boolean;
	isViewOnceMessage?: boolean;

	constructor(
		message: Baileys.WAChatUpdate | Baileys.WAMessageProto.WebMessageInfo,
		conn: Baileys.WAConnection
	) {
		// json
		if (message instanceof Baileys.WAMessageProto.WebMessageInfo) this.json = message;
		else {
			if (message.hasNewMessage && message.messages?.toJSON)
				this.json = message.messages.toJSON()[0];
			else return; // not a message, maybe presence update
		}

		if (this.json.message?.ephemeralMessage) {
			this.json.message = this.json.message.ephemeralMessage as Baileys.WAMessageProto.IMessage;
			this.isEphemeralMessage = true;
		}
		if (this.json.message?.viewOnceMessage) {
			this.json.message = this.json.message.viewOnceMessage as Baileys.WAMessageProto.IMessage;
			this.isViewOnceMessage = true;
		}

		// sender
		this.sender = this.json.participant
			? this.json.participant
			: this.json.key.fromMe === true
			? conn.user.jid
			: this.json.key.remoteJid;

		// group/remote jid
		this.rjid = this.json.key.remoteJid || undefined;

		if (this.json.message)
			for (const [p, m] of Object.entries(this.json.message)) {
				// message type
				this.mtype = p as keyof Baileys.proto.IMessage;

				/**
				 * @see https://adiwajshing.github.io/Baileys/interfaces/proto.imessage.html
				 */
				// text
				if (typeof m === 'string') this.text = m;
				if (m.contentText && p === 'buttonsMessage') this.text = m.contentText as string;
				if (m.text && p === 'extendedTextMessage') this.text = m.text as string;
				if (m.description && p === 'listMessage') this.text = m.description as string;
				if (m.message && p === 'orderMessage') this.text = m.message as string;
				if (
					m.selectedDisplayText &&
					(p === 'buttonsResponseMessage' || p === 'templateButtonReplyMessage')
				)
					this.text = m.selectedDisplayText as string;
				if (m.title && (p === 'listResponseMessage' || p === 'productMessage'))
					this.text = m.title as string;
				if (
					m.caption &&
					(p === 'groupInviteMessage' ||
						p === 'imageMessage' ||
						p === 'liveLocationMessage' ||
						p === 'videoMessage')
				)
					this.text = m.caption as string;

				// mentions
				if (this.text) {
					const match = methods.parseMentions(this.text);
					if (match) {
						this.mentioned = _.uniq(
							match.filter((number) =>
								((m?.contextInfo?.mentionedJid as string[]) || []).includes(number)
							) as string[]
						);
					} else {
						this.mentioned = [];
					}
				}

				// reserved
				// so no need to call quoted() for each message
				if (m?.contextInfo?.quotedMessage && m?.contextInfo?.participant)
					this._quotedsender = m.contextInfo.participant;

				break;
			}
	}

	/**
	 * Get the quoted/replied message
	 */
	async quoted($: methods.Wrapper) {
		if (this.json?.message) {
			for (const m of Object.values(this.json.message)) {
				if (m?.contextInfo?.quotedMessage && m?.contextInfo?.stanzaId) {
					try {
						const chat = await $.conn.loadMessage(this.rjid!, m.contextInfo.stanzaId);
						return new Message(chat, $.conn);
					} catch (e) {
						return logger.error(e);
					}
				}
				break;
			}
		} else {
			return;
		}
	}
}
