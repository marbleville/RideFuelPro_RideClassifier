import { typeOfRide, rideEntry } from "./types.js";
import config from "../config/rideClassifierConfig.js";

/**
 * Returns the type of ride based on the rideEntry object
 *
 * @param {rideEntry} ride - Ride object to be classfied
 * @param {Number} ftp - Rider's FTP
 *
 * @returns {typeOfRide} - Ride type
 */
export function getRideType(ride, ftp) {
	let totalIntervalTime = ride.intervals.reduce(
		(acc, interval) => acc + interval.time,
		0
	);

	let averageIntervalTime = totalIntervalTime / ride.intervals.length;

	if (totalIntervalTime < config.minTotalIntervalTime) {
		return typeOfRide.endurance;
	} else if (
		ride.average_watts > ftp * config.enduranceFTPThresholdCoefficient &&
		averageIntervalTime < config.minAverageIntervalTime
	) {
		return typeOfRide.race;
	} else {
		return typeOfRide.intervals;
	}
}
