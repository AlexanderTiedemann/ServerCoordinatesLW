import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { parse } from "@std/csv/parse";
import { decodeBase64 } from "@std/encoding";
import { html } from "@mark/html";

function ensureEnvVar(name: string) {
	const envVar = Deno.env.get(name);
	if (envVar === undefined) {
		throw new Error(`Missing env var ${name}`);
	}
	return envVar;
}

const privateKey = new TextDecoder().decode(decodeBase64(ensureEnvVar("PRIVATE_KEY")));

const authToken = new JWT({
	email: ensureEnvVar("CLIENT_EMAIL"),
	key: privateKey,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetId = ensureEnvVar("SHEET_ID");

const document = new GoogleSpreadsheet(sheetId, authToken);

await document.loadInfo();

const sheet = document.sheetsByIndex[0];

const csv = new TextDecoder().decode(new Uint8Array(await sheet.downloadAsCSV()));

const data = parse(csv, { separator: "," })
	.map((row, index) => {
		const rawData = row.slice(0, -4)
		return {
			server: index + 1,
			lastUpdate: rawData.at(-1)!,
			alliances: rawData.slice(0, -1)
				.map(x => x.trim())
				.filter(x => x !== "-"),
		};
	})
	.filter(x => x.alliances[1] !== "(no alliances)");

const indexHtml = html`
	<!DOCTYPE html>
	<style>
		html {
			font-family: system-ui;
		}
	</style>
	<table>
		<tr>
			<th>Server</th>
			<th>Last Update</th>
			<th>Top 10 Alliances</th>
		</tr>
		${data.map(x => html`
			<tr>
				<td>${x.server.toString()}</td>
				<td>${x.lastUpdate}</td>
				<td>${x.alliances.join(", ")}</td>
			</tr>
		`)}
	</table>
`();

await Deno.writeTextFile("./website/index.html", indexHtml);
