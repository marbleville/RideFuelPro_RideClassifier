const fs = require("fs");
const api = require("./stravaAPI.js");

/**
 * Writes num activities to the specified file
 * @param {number} num - Number of activities to write
 * @param {string} fileName - Name of file to write to
 */
async function writeActivites(num, fileName) {
	let perPage = 10;
	let numPages = num % perPage;

	let activities = [];

	for (let i = 1; i <= numPages + 1; i++) {
		let json = await api.getActivites(perPage, i);
		activities = activities.concat(json);
		console.log(`Page ${i} fetched`);
	}

	try {
		fs.writeFileSync(
			`../resources/${fileName}.json`,
			JSON.stringify(activities)
		);
		console.log(`${activities.length} Activities written to file`);
	} catch (error) {
		console.error(error);
	}
}

writeActivites(10, "activities");
