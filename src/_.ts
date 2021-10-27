import * as fs from 'fs';

if (!fs.existsSync('./tmp/')) fs.mkdirSync('./tmp/');

const tmps = fs.readdirSync('./tmp/');
if (tmps.length)
	for (const file of tmps) {
		fs.unlinkSync('./tmp/' + file);
	}

if (!fs.existsSync('./data/')) fs.mkdirSync('./data/');

if (!fs.existsSync('./data/media/')) fs.mkdirSync('./data/media/');

if (!fs.existsSync('./data/data.json')) fs.writeFileSync('./data/data.json', '{}');

if (!fs.existsSync('./miki-config.json')) fs.writeFileSync('./miki-config.json', '{}');

if (!fs.existsSync('./credentials/')) fs.mkdirSync('./credentials/');

function writeAuthJson() {
	fs.writeFileSync(
		'./credentials/auth.json',
		JSON.stringify({
			clientID: '',
			serverToken: '',
			clientToken: '',
			encKey: '',
			macKey: '',
		})
	);
}

if (!fs.existsSync('./credentials/auth.json')) writeAuthJson();

let AUTH_JSON;
try {
	AUTH_JSON = JSON.parse(fs.readFileSync('./credentials/auth.json').toString());
} catch (e) {
	console.error(e);
	writeAuthJson();
	AUTH_JSON = JSON.parse(fs.readFileSync('./credentials/auth.json').toString());
}

if (
	!(
		AUTH_JSON.clientID !== undefined &&
		AUTH_JSON.serverToken !== undefined &&
		AUTH_JSON.clientToken !== undefined &&
		AUTH_JSON.encKey !== undefined &&
		AUTH_JSON.macKey !== undefined
	)
)
	writeAuthJson();
