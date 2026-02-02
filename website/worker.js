let servers;

onmessage = ({ data }) => {
	if (data.servers !== undefined) {
		servers = data.servers;
	}
	if (data.input !== undefined) {
		const input = data.input;
		search(input.toLocaleLowerCase());
	}
};

function search(value) {
	const matchingServers = [];
	for (const server of servers) {
		if (serverMatches(server, value)) {
			matchingServers.push(server);
		}
	}
	postMessage({ value, matchingServers });
}

function serverMatches({ serverText, alliancesLowerCase }, value) {
	if (serverText.includes(value)) {
		return true;
	}
	for (const alliance of alliancesLowerCase) {
		if (alliance.includes(value)) {
			return true;
		}
	}
	return false;
}
