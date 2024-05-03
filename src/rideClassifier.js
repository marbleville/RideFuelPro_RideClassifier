// Object contianing the different types of rides
const typeOfRide = {
	intervals: "Intervals",
	endurance: "Endurance",
	race: "Race",
	unknown: "Unknown",
};

// Object containing a hill's associated data
const hillEntry = {
	idxStart: 0,
	idxEnd: 0,
	distance: 0,
	elevationGain: 0,
	averageGradient: 0,
	averageSpeed: 0,
	averageWatts: 0,
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
	hills: [],
	workout_type: "",
};

/**
 * Classfies an array of rides into different types
 *
 * @param {Array} rides - Array of rides to be classified
 * @param {Number} ftp - Rider's FTP
 * @returns {Array} - Array of classified rides
 */
function getRideTypeArray(rides, ftp) {
	for (let ride of rides) {
		ride.workout_type = getRideType(ride, ftp);
	}
	return rides;
}

/**
 * Returns the type of ride based on the rideEntry object
 *
 * @param {rideEntry} ride - Ride object to be classfied
 * @param {Number} ftp - Rider's FTP
 * @returns {String} - Ride type
 */
function getRideType(ride, ftp) {
	return typeOfRide.unknown;
}

/**
 * Calculates the missing values for a single ride
 *
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
 * - hills
 * - workout_type
 *
 * @param {rideEntry} ride - Ride object to calculate missing values for
 * @returns {rideEntry} - Ride object with missing values calculated
 */
function calculateMissingRideValues(ride, ftp) {
	ride.hills = findHills(ride);

	ride.average_watts_uphill = getUphillWatts(ride);
	ride.average_watts_downhill = getDownhillWatts(ride);
	ride.average_watts_flat = getFlatWatts(ride);
	ride.average_speed_uphill = getUphillSpeed(ride);
	ride.average_speed_downhill = getDownhillSpeed(ride);
	ride.average_speed_flat = getFlatSpeed(ride);
	ride.percent_up = getUphillPercentage(ride);
	ride.percent_down = getDownhillPercentage(ride);
	ride.percent_flat = getFlatPercentage(ride);
	ride.average_uphill_gradient = getAverageUphillGradient(ride);

	ride.workout_type = getRideType(ride, ftp);

	return ride;
}

/**
 * Returns the average watts for uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 * @returns {Number} - Average watts for uphill sections
 */
function getUphillWatts(ride) {
	return 0;
}

/**
 * Returns the average watts for downhill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 * @returns {Number} - Average watts for downhill sections
 */
function getDownhillWatts(ride) {
	return 0;
}

/**
 * Returns the average watts for flat sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 * @returns {Number} - Average watts for flat sections
 */
function getFlatWatts(ride) {
	return 0;
}

/**
 * Returns the average speed for uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 * @returns {Number} - Average speed for uphill sections in meters per second
 */
function getUphillSpeed(ride) {
	return 0;
}

/**
 * Returns the average speed for downhill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 * @returns {Number} - Average speed for downhill sections in meters per second
 */
function getDownhillSpeed(ride) {
	return 0;
}

/**
 * Returns the average speed for flat sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 * @returns {Number} - Average speed for flat sections in meters per second
 */
function getUphillSpeed(ride) {
	return 0;
}

/**
 * Returns the percent of the total distance of the ride that is uphill
 *
 * @param {rideEntry} ride - Ride object to calculate uphill percent from
 * @returns {Number} - Percent of ride that is uphill as a decimal
 */
function getUphillPercentage(ride) {
	return 0;
}

/**
 * Returns the percent of the total distance of the ride that is downhill
 *
 * @param {rideEntry} ride - Ride object to calculate downhill percent from
 * @returns {Number} - Percent of ride that is downhill as a decimal
 */
function getDownhillPercentage(ride) {
	return 0;
}

/**
 * Returns the percent of the total distance of the ride that is flat
 *
 * @param {rideEntry} ride - Ride object to calculate flat percent from
 * @returns {Number} - Percent of ride that is flat as a decimal
 */
function getFlatPercentage(ride) {
	return 0;
}

/**
 * Returns the average gradient of the uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate average gradient from
 * @returns {Number} - Average gradient of all hills in the ride, as a decimal
 */
function getAverageUphillGradient(ride) {
	return 0;
}

/**
 * Finds hills in a ride and adds them to the ride object
 *
 * @param {rideEntry} ride - Ride object to find hills from
 * @returns {Array} - Array of hillEntries found in the ride
 */
function findHills(ride) {
	let hills = [];

	return hills;
}

export default {
	rideEntry,
	typeOfRide,
	calculateMissingRideValues,
};
