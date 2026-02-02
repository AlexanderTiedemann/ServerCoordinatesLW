document.addEventListener("DOMContentLoaded", main);

function main() {
	const servers = data.map(({ server, alliances, lastUpdate }) => ({
		server,
		serverText: server.toString(),
		alliances,
		alliancesLowerCase: alliances.map(a => a.toLocaleLowerCase()),
		lastUpdate,
	}));

	const worker = new Worker("./worker.js");
	worker.postMessage({ servers });

	const input = document.querySelector("input");
	if (location.hash !== "") {
		input.value = location.hash.slice(1);
	}
	const tbody = document.querySelector("tbody");

	input.addEventListener("input", () => {
		const value = input.value.trim();
		if (value === "") {
			tbody.replaceChildren();
			location.hash = "";
		} else {
			worker.postMessage({ input: input.value });
		}
	});

	worker.onmessage = ({ data }) => {
		updateTbody(tbody, data);
		location.hash = data.value;
	};

	if (location.hash !== "") {
		worker.postMessage({ input: location.hash.slice(1) });
	}
};

function updateTbody(tbody, { value, matchingServers }) {
	const fragment = document.createDocumentFragment();

	for (const { serverText, alliances, lastUpdate } of matchingServers) {
		const tr = document.createElement("tr");
		const td1 = tr.insertCell();

		if (serverText.includes(value)) {
			const b = document.createElement("b");
			b.textContent = serverText;
			td1.appendChild(b);
		} else {
			td1.textContent = serverText;
		}

		for (const alliance of alliances) {
			const td = tr.insertCell();
			if (alliance.toLocaleLowerCase().includes(value)) {
				const b = document.createElement("b");
				b.textContent = alliance;
				td.appendChild(b);
			} else {
				td.textContent = alliance;
			}
		}

		if (alliances.length < 10) {
			for (let i = 0; i < 10 - alliances.length; i++) {
				tr.insertCell();
			}
		}

		const td10 = tr.insertCell();
		td10.textContent = lastUpdate;
		tr.appendChild(td10);
		fragment.appendChild(tr);
	}

	tbody.replaceChildren(fragment);
}
