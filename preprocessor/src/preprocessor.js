import fs from "fs";

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

/**
 * Write an array of preprocessed rideEntry objects to a .JSON file
 *
 * @param {Array<rideEntryProc>} activities the preprocessed rideEntry objects
 * @param {string} fileName the name of the file to write
 */
function writePreprocessedJSON(activities, fileName) {
	fs.writeFileSync(fileName, JSON.stringify(activities, null, 2));
}

/**
 * Preprocess an array of rideEntry objects
 *
 * @param {Array<rideEntry>} activities the rideEntry objects to process
 *
 * @returns {Array<rideEntryProc>} the processed rideEntry objects
 */
function processActivities(activities) {
	let processedActivities = [];
	activities.forEach((activity) => {
		let processedActivity = processActivity(activity);
		processedActivities.push(processedActivity);
	});
	return processedActivities;
}

/**
 * Process a single rideEntry object
 *
 * @param {rideEntry} activity the rideEntry object to process
 *
 * @returns {rideEntryProc} the processed rideEntry object
 */
function processActivity(activity) {
	let [
		distance_uphill,
		distance_downhill,
		average_uphill_gradient,
		average_downhill_gradient,
	] = getRideHillStats(activity);

	let processedActivity = {
		distance: activity.distance,
		moving_time: activity.moving_time,
		total_elevation_gain: activity.total_elevation_gain,
		distance_uphill: distance_uphill,
		distance_downhill: distance_downhill,
		average_uphill_gradient: average_uphill_gradient,
		average_downhill_gradient: average_downhill_gradient,
		workout_type: activity.workout_type,
	};

	return processedActivity;
}

/**
 * Calculate the hill stats for a rideEntry object
 *
 * @param {rideEntry} activity the rideEntry object to get hill stats for
 *
 * @returns {Array} an array containing the distance uphill, distance downhill,
 *                  average uphill gradient, and average downhill gradient
 */
function getRideHillStats(activity) {
	let distance_uphill = 0;
	let distance_downhill = 0;
	let average_uphill_gradient = 0;
	let average_downhill_gradient = 0;

	let num_uphill = 0;
	let num_downhill = 0;

	activity.hills.forEach((hill) => {
		if (hill.averageGradient > 0) {
			distance_uphill += hill.distance;
			average_uphill_gradient += hill.averageGradient;
			num_uphill++;
		} else {
			distance_downhill += hill.distance;
			average_downhill_gradient += hill.averageGradient;
			num_downhill++;
		}
	});

	average_downhill_gradient /= num_downhill;
	average_uphill_gradient /= num_uphill;

	return [
		distance_uphill,
		distance_downhill,
		average_uphill_gradient,
		average_downhill_gradient,
	];
}

function main() {
	let activities = readActivitiesJSON("../resources/activities.json");
	let processedActivities = processActivities(activities);
	writePreprocessedJSON(
		processedActivities,
		"../resources/processedActivities.json"
	);
}

main();

// Object containing a ride's assiciated data
const rideEntryProc = {
	distance: 0,
	moving_time: 0,
	total_elevation_gain: 0,
	distance_uphill: 0,
	distance_downhill,
	average_uphill_gradient,
	average_downhill_gradient,
	workout_type,
};
