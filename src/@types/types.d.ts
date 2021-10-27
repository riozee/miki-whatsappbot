import type Baileys from '@adiwajshing/baileys';
import type * as methods from '../utils/methods';
import type { Message } from '../utils/message';
import type { DB } from '../handlers/database';

export interface IDatabase {
	[k: string]: any;
}

export type Wrapper = methods.Wrapper;

export type PluginOnCommand = (arg: Required<Wrapper>) => any;

export type PluginOnMessage = (arg: Wrapper) => any;

export type PluginData = {
	command: string[];
	category: string;
};

export interface IPlugin {
	onCommand?: PluginOnCommand;
	onMessage?: PluginOnMessage;
	data: PluginData;
}

export interface IMessage extends Message {}

export type DB = typeof DB;
