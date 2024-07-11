var LowpassFilter = require("lowpassf");

import { rideEntry } from ".types";
import { findHills } from "./hillFinder";
import { findIntervals } from "./intervalFinder";

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
 * - intervals
 * - workout_type
 *
 * @param {rideEntry} ride - Ride object to calculate missing values for
 * @returns {rideEntry} - Ride object with missing values calculated
 */
export function calculateMissingRideValues(ride, ftp) {
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
	// ride.intervals = findIntervals(ride);

	ride.workout_type = getRideType(ride, ftp);

	return ride;
}

/**
 * Returns the average watts for uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 *
 * @returns {Number} - Average watts for uphill sections
 */
function getUphillWatts(ride) {
	let uphillWatts = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient > 0) {
			uphillWatts += hill.averageWatts / ride.hills.length;
		}
	}

	return uphillWatts;
}

/**
 * Returns the average watts for downhill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 *
 * @returns {Number} - Average watts for downhill sections
 */
function getDownhillWatts(ride) {
	let downhillWatts = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient < 0) {
			downhillWatts += hill.averageWatts / ride.hills.length;
		}
	}

	return downhillWatts;
}

/**
 * Returns the average watts for flat sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill watts from
 *
 * @returns {Number} - Average watts for flat sections
 */
function getFlatWatts(ride) {
	// (u + d + f) / 3 = a -> f = 3a - u - d

	return (
		3 * ride.average_watts -
		ride.average_watts_uphill -
		ride.average_watts_downhill
	);
}

/**
 * Returns the average speed for uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 *
 * @returns {Number} - Average speed for uphill sections in meters per second
 */
function getUphillSpeed(ride) {
	let uphillSpeed = 0;
	let total = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient > 0) {
			total++;
			uphillSpeed += hill.averageSpeed;
		}
	}

	return uphillSpeed / total;
}

/**
 * Returns the average speed for downhill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 *
 * @returns {Number} - Average speed for downhill sections in meters per second
 */
function getDownhillSpeed(ride) {
	let downhillSpeed = 0;
	let total = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient < 0) {
			total++;
			downhillSpeed += hill.averageSpeed;
		}
	}

	return downhillSpeed / total;
}

/**
 * Returns the average speed for flat sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate uphill speed from
 *
 * @returns {Number} - Average speed for flat sections in meters per second
 */
function getFlatSpeed(ride) {
	// (u + d + f) / 3 = a -> f = 3a - u - d

	return (
		3 * ride.average_speed -
		ride.average_speed_uphill -
		ride.average_speed_downhill
	);
}

/**
 * Returns the percent of the total distance of the ride that is uphill
 *
 * @param {rideEntry} ride - Ride object to calculate uphill percent from
 *
 * @returns {Number} - Percent of ride that is uphill as a decimal
 */
function getUphillPercentage(ride) {
	let totalUphillDistance = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient > 0) {
			totalUphillDistance += hill.distance;
		}
	}

	return totalUphillDistance / ride.distance;
}

/**
 * Returns the percent of the total distance of the ride that is downhill
 *
 * @param {rideEntry} ride - Ride object to calculate downhill percent from
 *
 * @returns {Number} - Percent of ride that is downhill as a decimal
 */
function getDownhillPercentage(ride) {
	let totalDownhillDistance = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient < 0) {
			totalDownhillDistance += hill.distance;
		}
	}

	return totalDownhillDistance / ride.distance;
}

/**
 * Returns the percent of the total distance of the ride that is flat
 *
 * @param {rideEntry} ride - Ride object to calculate flat percent from
 *
 * @returns {Number} - Percent of ride that is flat as a decimal
 */
function getFlatPercentage(ride) {
	return 1 - ride.percent_up - ride.percent_down;
}

/**
 * Returns the average gradient of the uphill sections of a ride
 *
 * @param {rideEntry} ride - Ride object to calculate average gradient from
 *
 * @returns {Number} - Average gradient of all hills in the ride, as a decimal
 */
function getAverageUphillGradient(ride) {
	let avgGradient = 0;
	let total = 0;

	for (let hill of ride.hills) {
		if (hill.averageGradient > 0) {
			total++;
			avgGradient += hill.averageGradient;
		}
	}

	return avgGradient / total;
}
