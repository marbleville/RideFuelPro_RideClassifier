const fs = require("fs");
const api = require("./stravaAPI.js");

// Object contianing the different types of rides
const typeOfRide = {
	intervals: "Intervals",
	endurance: "Endurance",
	race: "Race",
	unknown: "Unknown",
};

// Object containing a ride's assiciated data
let rideEntry = {
	name: "",
	distance: 0,
	moving_time: 0,
	total_elevation_gain: 0,
	percent_up: 0,
	percent_down: 0,
	percent_flat: 0,
	average_uphill_gradient: 0,
	average_speed: 0,
	average_watts: 0,
	weighted_average_watts: 0,
	kilojoules: 0,
	average_heartrate: 0,
	power_stream: [],
	altitude_stream: [],
	workout_type: "",
};

/**
 * Retuns an array of num activities
 * @param {Number} num - Number of cycling activities to write
 * @returns {Array} - Array of num activites
 */
async function getNumActivites(num) {
	let perPage = 10;
	let page = 1;

	let activities = [];

	// Load num rides into the activities array
	while (activities.length < num) {
		let json = await api.getActivites(perPage, page);

		for (activity of json) {
			// only add rides to the activities array
			if (activity.type === "Ride") {
				activities.push(activity);
			}
			if (activities.length === num) {
				break;
			}
		}

		page++;
	}

	return activities;
}
/**
 *  Returns an array of rides with only the necessary information and power streams added
 *
 * @param {Array} rides
 * @returns {Array} - Array of refactored rides
 */
function refactorRides(rides) {
	let refactoredRides = [];
}

/**
 * Classfies an array of rides into different types
 *
 * @param {Array} rides - Array of rides to be classified
 * @param {Number} ftp - Rider's FTP
 * @returns {Array} - Array of classified rides
 */
function getRideTypeArray(rides, ftp) {}

/**
 * Returns the type of ride based on the rideEntry object
 *
 * @param {rideEntry} ride - Ride object to be classfied
 * @param {Number} ftp - Rider's FTP
 * @returns {String} - Ride type
 */
function getRideType(ride, ftp) {}

/**
 * Main function for the classifier script
 *
 * @returns {Number} - 1 on error, 0 on success
 */
function main() {
	// Get the command line arguments.
	const args = process.argv.slice(2);

	// Check if the correct number of arguments were passed.
	if (args.length !== 2) {
		console.log("Usage: node index.js [num_activities] [rider_ftp]");
		return 1;
	}
}
getNumActivites(10, "activities");
