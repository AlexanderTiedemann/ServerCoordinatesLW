import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { parse } from "@std/csv/parse";
import { html } from "@mark/html";
import credentials from "./servercoordinateslw-b80f5a7645ec.json" with { type: "json" };

const authToken = new JWT({
	email: credentials.client_email,
	key: credentials.private_key,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheetId = Deno.env.get("SHEET_ID")!;

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

await Deno.writeTextFile("./docs/index.html", indexHtml);
