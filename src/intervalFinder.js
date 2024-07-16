import { intervalEntry, rideEntry } from "./types.js";
import LowpassFilter from "lowpassf";

/**
 * Finds intervals in a ride and adds them to the ride object
 *
 * @param {rideEntry} ride - Ride object to find intervals from
 *
 * @returns {Array<intervalEntry>} - Array of interval objects found in the ride
 */
export function findIntervals(ride) {
	/**
	 * Algorithm to find intervals:
	 *
	 * Search in 50 index chunks until a chunk avgerage watts is 20% higher than
	 * average watts
	 * 		- Store the start of the interval
	 * 		- Then begin a greedy search on both ends of the interval to
	 * 			maximize the average watts
	 * 			greeding searhc moves interval ends by 10 indexes at a time
	 */

	const INTERVAL_THRESHOLD = 1.2;
	const SEARCH_INCREMENT = 50;
	const GREEDY_SEARCH_INCREMENT = 10;

	let intervals = [];

	// for (let i = 0; i < ride.power_stream.length; i += SEARCH_INCREMENT) {
	// 	// If the end of the stream is reached
	// 	if (i + SEARCH_INCREMENT >= ride.power_stream.length) {
	// 		break;
	// 	}

	// 	let intervalStart = i;
	// 	let intervalEnd = i + SEARCH_INCREMENT;

	// 	// If the average watts are not high enough, continue
	// 	let intervalAverageWatts = getIntervalAverageWatts(
	// 		ride,
	// 		intervalStart,
	// 		intervalEnd
	// 	);

	// 	if (intervalAverageWatts < ride.average_watts * INTERVAL_THRESHOLD) {
	// 		continue;
	// 	}

	// 	let greedySearch = true;
	// 	while (greedySearch) {}
	// }

	return intervals;
}

/**
 * Returns the average watts for an interval in a ride
 *
 * @param {rideEntry} ride - Ride object to calculate interval values from
 * @param {Number} start - Start index of the interval
 * @param {Number} end - End index of the interval
 */
function getIntervalAverageWatts(ride, start, end) {
	let sum = 0;
	let count = 0;

	for (let i = start; i < end; i++) {
		sum += getCleanPowerStream(ride)[i];
		count++;
	}

	return sum / count;
}

/**
 *	Cleans the power stream of a ride by smoothing the power file and removing
 *	erroneous data
 *
 * @param {rideEntry} ride - Ride object to clean the power stream of
 *
 * @returns {Array} - Cleaned power stream
 */
export function getCleanPowerStream(ride) {
	const smoothAlgGroupSize = 10;

	let averagedPowerStream = [...ride.power_stream];

	// moving average of the power stream to smooth out the data
	for (
		let i = smoothAlgGroupSize;
		i < ride.power_stream.length - smoothAlgGroupSize;
		i++
	) {
		let sum = 0;
		for (let j = i - smoothAlgGroupSize; j < i + smoothAlgGroupSize; j++) {
			sum += ride.power_stream[j];
		}
		averagedPowerStream[i] = sum / (2 * smoothAlgGroupSize);
	}

	return averagedPowerStream;
}

/**
 * Returns the average from start to start + x of the given array
 *
 * @param {Number} number the number of the element to average
 * @param {Number} start the start index of the array to average
 * @param {Array<Number>} array the array to average
 *
 * @returns {Number} the average of the array from start to start + x
 */
function getXElementAverage(number, start, array) {
	let sum = 0;

	for (let i = start; i <= array.length - 1; i++) {
		sum += array[i][number];
	}

	return sum / array.length;
}
