const fs = require("fs");

/**
 * Read a json file of activites and returns an array of rideEntry objects
 *
 * @param {string} fileName the name of a .JSON file containing serialized
 *                          rideEntry objects
 *
 * @returns {Array} an array of rideEntry objects
 */
function readActivitiesJSON(fileName) {
	let activities = JSON.parse(fs.readFileSync(fileName));
	return activities;
}
