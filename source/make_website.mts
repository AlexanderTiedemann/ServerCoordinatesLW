import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { parse } from "@std/csv/parse";
import { decodeBase64 } from "@std/encoding";

const sheetId = ensureEnvVar("SHEET_ID");

const privateKey = new TextDecoder().decode(decodeBase64(ensureEnvVar("PRIVATE_KEY")));

const authToken = new JWT({
	email: ensureEnvVar("CLIENT_EMAIL"),
	key: privateKey,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const document = new GoogleSpreadsheet(sheetId, authToken);

await document.loadInfo();

const sheet = document.sheetsByIndex[0];

const csv = new TextDecoder().decode(new Uint8Array(await sheet.downloadAsCSV()));

const data = parse(csv, { separator: "," })
	.map((row, index) => {
		return {
			server: index + 1,
			lastUpdate: row[10],
			alliances: row.slice(0, 10)
				.map(x => x.trim())
				.filter(x => x !== "-"),
		};
	})
	.filter(x => !(
		x.alliances[0] === "Closed server"
			|| x.alliances[1] === "(no alliances)"
	));

await Deno.writeTextFile("./website/data.js", `window.data = ${JSON.stringify(data)};`);

for (const { server, lastUpdate, alliances } of data) {
	if (!lastUpdate.match(/^\d{4}-\d{2}-\d{2}$/)) {
		console.log(`Server ${server}: Invalid update date: ${lastUpdate}`);
	}
	for (const alliance of alliances) {
		if (!alliance.match(/^[a-zA-Z0-9]{3,4}$/)) {
		console.log(`Server ${server}: Invalid alliance name: ${alliance}`);
		}
	}
}

function ensureEnvVar(name: string) {
	const envVar = Deno.env.get(name);
	if (envVar === undefined) {
		throw new Error(`Missing env var ${name}`);
	}
	return envVar;
}
