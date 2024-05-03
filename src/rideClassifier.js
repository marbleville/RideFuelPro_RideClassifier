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
 * @param {rideEntry} ride - Ride object to calculate missing values for
 * @returns {rideEntry} - Ride object with missing values calculated
 */
function calculateMissingRideValues(ride) {}

module.exports = {
	rideEntry,
	typeOfRide,
	getRideType,
	calculateMissingRideValues,
};
