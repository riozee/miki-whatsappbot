import * as fs from 'fs';
import * as logger from '../utils/logger';
import { exec } from 'child_process';

export const CONFIG = JSON.parse(fs.readFileSync('./miki-config.json').toString());

export const UID_SUFFIX = '@c.us';

export const JID_SUFFIX = '@s.whatsapp.net';

export const GID_SUFFIX = '@g.us';

export const BROADCASTID_SUFFIX = '@broadcast';

export const BAILEYS_MESSAGE_ID_PREFIX = '3EB0';

export const OWNER_NUMBER: string[] = CONFIG.owner_number.map((number: string) => number + JID_SUFFIX);

export const API_URL = 'localhost:3000';

export const API_KEY: string = CONFIG.api_key;

export const BOT_NAME: string = CONFIG.bot_name;

export const DEFAULT_STICKER_PACKNAME: string = CONFIG.default_sticker_packname;

export const DEFAULT_STICKER_AUTHOR: string = CONFIG.default_sticker_author;

export const U8205 = String.fromCharCode(8205);

export const REGEX_MENTION =
	/@(?:999|998|997|996|995|994|993|992|991|990|979|978|977|976|975|974|973|972|971|970|969|968|967|966|965|964|963|962|961|960|899|898|897|896|895|894|893|892|891|890|889|888|887|886|885|884|883|882|881|880|879|878|877|876|875|874|873|872|871|870|859|858|857|856|855|854|853|852|851|850|839|838|837|836|835|834|833|832|831|830|809|808|807|806|805|804|803|802|801|800|699|698|697|696|695|694|693|692|691|690|689|688|687|686|685|684|683|682|681|680|679|678|677|676|675|674|673|672|671|670|599|598|597|596|595|594|593|592|591|590|509|508|507|506|505|504|503|502|501|500|429|428|427|426|425|424|423|422|421|420|389|388|387|386|385|384|383|382|381|380|379|378|377|376|375|374|373|372|371|370|359|358|357|356|355|354|353|352|351|350|299|298|297|296|295|294|293|292|291|290|289|288|287|286|285|284|283|282|281|280|269|268|267|266|265|264|263|262|261|260|259|258|257|256|255|254|253|252|251|250|249|248|247|246|245|244|243|242|241|240|239|238|237|236|235|234|233|232|231|230|229|228|227|226|225|224|223|222|221|220|219|218|217|216|215|214|213|212|211|210|98|95|94|93|92|91|90|86|84|82|81|66|65|64|63|62|61|60|58|57|56|55|54|53|52|51|49|48|47|46|45|44|43|41|40|39|36|34|33|32|31|30|27|20|7|1)[0-9]{3,14}/g;

export const TEXTS = (() => {
	const _: { [k: string]: { [k: string]: string } } = {};
	for (const lang of fs.readdirSync('./languages/')) {
		try {
			_[lang.replace('.json', '')] = JSON.parse(fs.readFileSync('./languages/' + lang).toString());
		} catch {}
	}
	return _;
})();

export let THUMB: Buffer;

if (fs.existsSync('./res/thumb.jpg') || fs.existsSync('./res/thumb.png')) {
	const filename = fs.existsSync('./res/thumb.jpg') ? './res/thumb.jpg' : './res/thumb.png';
	const output = `./res/${Date.now()}-${process.hrtime()[1]}.jpg`;
	exec(
		`ffmpeg -i ${filename} -crf 15 -vf "scale='if(gt(a,1),600,-1)':'if(gt(a,1),-1,350)'" ${output}`,
		(error) => {
			if (error) return logger.error(error);
			fs.writeFileSync(filename, fs.readFileSync(output));
			fs.unlinkSync(output);
			THUMB = fs.readFileSync(filename);
		}
	);
}