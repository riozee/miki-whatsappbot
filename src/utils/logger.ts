/**
 * @utils/logger.ts
 *
 * Functions to log to the console
 */

import * as Type from '../@types/types';
import moment from 'moment';
import chalk from 'chalk';
import _ from 'lodash';

export function trace(val: any, ...arg: any) {
	return;
	// [TRACE:timestamp] text
	console.trace(chalk.gray(`[TRACE:${moment().format('D/MM,hh:mm:ss')}]`), val, ...arg, '\n');
}

export function debug(val: any, ...arg: any) {
	if (!process.env.DEBUG) return;
	// [DEBUG:timestamp] text
	console.log(chalk.blue(`[DEBUG:${moment().format('D/MM,hh:mm:ss')}]`), val, ...arg, '\n');
	return true;
}

export function info(val: any, ...arg: any) {
	// [INFO:timestamp] text
	console.log(chalk.cyan(`[INFO:${moment().format('D/MM,hh:mm:ss')}]`), val, ...arg, '\n');
}

export function warn(val: any, ...arg: any) {
	// [WARN:timestamp] text
	console.log(chalk.yellow(`[WARN:${moment().format('D/MM,hh:mm:ss')}]`), val, ...arg, '\n');
}

export function error(err: any, ...arg: any) {
	// [ERROR:timestamp] err
	console.log(
		chalk.red(`[ERROR:${moment().format('D/MM,hh:mm:ss')}]`),
		err?.stack || err,
		...arg,
		'\n'
	);
}

export function fatal(err: any, ...arg: any) {
	// [FATALERROR:timestamp] err
	console.log(
		chalk.red.bgBlack(`[FATALERROR:${moment().format('D/MM,hh:mm:ss')}]`),
		err?.stack || err,
		...arg,
		'\n'
	);
}
