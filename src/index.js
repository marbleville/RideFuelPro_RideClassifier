const fs = require("fs");
const api = require("./stravaAPI.js");
const { time } = require("console");

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
	average_speed_uphill: 0,
	average_speed_downhill: 0,
	average_speed_flat: 0,
	total_elevation_gain: 0,
	average_speed: 0,
	average_watts: 0,
	average_watts_uphill: 0,
	average_watts_downhill: 0,
	average_watts_flat: 0,
	weighted_average_watts: 0,
	kilojoules: 0,
	average_heartrate: 0,
	power_stream: [],
	altitude_stream: [],
	distance_stream: [],
	time_stream: [],
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
async function refactorRides(rides) {
	let refactoredRides = [];

	for (let ride of rides) {
		let rideData = Object.create(rideEntry);

		rideData.name = ride.name;
		rideData.distance = ride.distance;
		rideData.moving_time = ride.moving_time;
		rideData.total_elevation_gain = ride.total_elevation_gain;
		rideData.average_watts = ride.average_watts;
		rideData.average_watts_uphill = -1;
		rideData.average_watts_downhill = -1;
		rideData.average_watts_flat = -1;
		rideData.average_speed_uphill = -1;
		rideData.average_speed_downhill = -1;
		rideData.average_speed_flat = -1;
		rideData.weighted_average_watts = ride.weighted_average_watts;
		rideData.average_speed = ride.average_speed;
		rideData.kilojoules = ride.kilojoules;
		rideData.average_heartrate = ride.average_heartrate;
		rideData.workout_type = typeOfRide.unknown;
		rideData.percent_up = 0;
		rideData.percent_down = 0;
		rideData.percent_flat = 0;
		rideData.average_uphill_gradient = 0;

		// Get streams
		let powerStream = await api.getActivityStreams(ride.id);

		rideData.power_stream = powerStream.watts;
		rideData.altitude_stream = powerStream.altitude;
		rideData.distance_stream = powerStream.distance;
		rideData.time_stream = powerStream.time;
	}
}

/**
 * Calculates the missing values for an array of rides
 * Missing values include:
 * - average_watts_uphill
 * - average_watts_downhill
 * - average_watts_flat
 * - average_speed_uphill
 * - average_speed_downhill
 * - average_speed_flat
 * - percent_up
 * - percent_down
 * - percent_flat
 * - average_uphill_gradient
 *
 * @param {Array} rides - Array of rides to calculate missing values for
 * @returns {Array} - Array of rides with missing values calculated
 */
function calculateMissingRideValuesArray(rides) {}

/**
 * Calculates the missing values for a single ride
 *
 * @param {rideEntry} ride - Ride object to calculate missing values for
 * @returns {rideEntry} - Ride object with missing values calculated
 */
function calculateMissingRideValues(ride) {}

/**
 * Classfies an array of rides into different types
 *
 * @param {Array} rides - Array of rides to be classified
 * @param {Number} ftp - Rider's FTP
 * @returns {Array} - Array of classified rides
 */
function getRideTypeArray(rides, ftp) {}

/**
 * Main function for the classifier script
 *
 * @returns {Number} - 1 on error, 0 on success
 */
async function main() {
	// Get the command line arguments.
	const args = process.argv.slice(2);

	// Check if the correct number of arguments were passed.
	if (args.length !== 2) {
		console.log("Usage: node src/index.js [num_activities] [rider_ftp]");
		return 1;
	}

	let num = parseInt(args[0]);
	let ftp = parseInt(args[1]);

	let activites = await getNumActivites(num);
	activites = await refactorRides(activites);
	activites = calculateMissingRideValuesArray(activites);
	activites = getRideTypeArray(activites, ftp);

	// try {
	// 	fs.writeFileSync("activites.json", JSON.stringify(activites));
	// 	return 0;
	// } catch (error) {
	// 	console.error(error);
	// 	return 1;
	// }
}

main();
