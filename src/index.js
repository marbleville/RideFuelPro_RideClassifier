import { writeFileSync, readFileSync } from "fs";
import { getActivites, getActivityStreams } from "./stravaAPI.js";
import { calculateMissingRideValues } from "./rideEntry.js";
import { drawRideAltitude, drawRidePower } from "./graphRides.js";
import { rideEntry, typeOfRide } from "./types.js";
import { getCleanPowerStream } from "./intervalFinder.js";

/**
 * Retuns an array of num activities
 *
 * @param {Number} num - Number of cycling activities to write
 * @returns {Array} - Array of num activites
 */
async function getNumActivites(num) {
	let perPage = 10;
	let page = 1;

	let activities = [];

	// Load num rides into the activities array
	while (activities.length < num) {
		let json = await getActivites(perPage, page);

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
async function refactorStravaRides(rides) {
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
		rideData.hills = [];

		// Get streams
		let powerStream = await getActivityStreams(ride.id);

		console.log(powerStream);

		rideData.power_stream = powerStream.watts.data;
		rideData.altitude_stream = powerStream.altitude.data;
		rideData.distance_stream = powerStream.distance.data;
		rideData.time_stream = powerStream.time.data;

		refactoredRides.push(rideData);
	}

	return refactoredRides;
}

/**
 * Calculates the missing values for an array of rides
 *
 * @param {Array} rides - Array of rides to calculate missing values for
 * @returns {Array} - Array of rides with missing values calculated
 */
function calculateMissingRideValuesArray(rides, ftp) {
	for (let ride of rides) {
		ride = calculateMissingRideValues(ride, ftp);
	}
	return rides;
}

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
	activites = await refactorStravaRides(activites);
	activites = calculateMissingRideValuesArray(activites, ftp);

	try {
		writeFileSync("../resources/activites.json", JSON.stringify(activites));
		return 0;
	} catch (error) {
		console.error(error);
		return 1;
	}
}

async function testCalculateMissingRideValuesArray() {
	try {
		const data = readFileSync("../resources/activites.json", "utf8");
		let rides = JSON.parse(data);
		calculateMissingRideValuesArray(rides, 250);
		// rides[0].power_stream = getCleanPowerStream(rides[0]);
		console.log(rides[0].intervals);
		drawRidePower(rides[0]);
		//drawRideAltitude(rides[0]);
	} catch (err) {
		console.error(err);
	}
}

//main();
testCalculateMissingRideValuesArray();
