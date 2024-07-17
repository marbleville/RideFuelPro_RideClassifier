import { intervalEntry, rideEntry } from "./types.js";
import config from "../config/intervalFinderConfig.js";

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
	const smoothAlgGroupSize = config.smoothAlgGroupSize;
	const removeOutliersGroupSize = config.removeOutliersGroupSize;
	const thresholdCoefficient = config.thresholdCoefficient;

	let noZeroStream = removeZeroValues(ride.power_stream);

	let avgStream = getMovingAverageStream(noZeroStream, smoothAlgGroupSize);

	return removeStreamOutliers(avgStream, 100, 2);
}

/**
 * Replaces all zero values in a stream with the average of the stream
 *
 * @param {Array<Number>} stream the stream to remove zero values from
 *
 * @returns {Array<Number>} The stream with zero values removed
 */
function removeZeroValues(stream) {
	let sum = stream.reduce((a, b) => a + b, 0);
	let average = sum / stream.length;

	return stream.map((val) => (val === 0 ? average : val));
}

/**
 * Returns the moving average of a stream
 *
 * @param {Array<Number>} stream The stream to smooth
 * @param {Number} groupSize The size of the group to average on either side of
 * 							 the current index
 *
 * @returns {Array<Number>} The smoothed stream
 */
function getMovingAverageStream(stream, groupSize) {
	let averagedPowerStream = [...stream];

	// moving average of the power stream to smooth out the data
	for (let i = 0; i < stream.length; i++) {
		let groupStart = i < groupSize ? 0 : i - groupSize;
		let groupEnd =
			i + groupSize > stream.length ? stream.length : i + groupSize;

		let group = stream.slice(groupStart, groupEnd);
		let sum = group.reduce((a, b) => a + b, 0);
		averagedPowerStream[i] = sum / groupSize;
	}

	return averagedPowerStream;
}

/**
 * Removes outliers from a stream
 *
 * @param {Array<Number>} stream
 * @param {Number} groupSize
 * @param {Number} thresholdCoefficient the coefficient to multiply the standard
 * 										deviation by to determine an outlier
 *
 * @returns {Array<Number>} The stream with outliers removed
 */
function removeStreamOutliers(stream, groupSize, thresholdCoefficient) {
	let noOutlierStream = [...stream];

	for (let i = 0; i < stream.length - groupSize; i += groupSize) {
		let group = stream.slice(i, i + groupSize);
		let sum = group.reduce((a, b) => a + b, 0);
		let groupAverage = sum / groupSize;
		let standardDeviation = Math.sqrt(
			group.reduce((a, b) => a + (b - groupAverage) ** 2, 0) / groupSize
		);

		let upperBound =
			groupAverage + thresholdCoefficient * standardDeviation;
		let lowerBound =
			groupAverage - thresholdCoefficient * standardDeviation;

		for (let j = i; j < i + groupSize; j++) {
			if (stream[j] > upperBound || stream[j] < lowerBound) {
				noOutlierStream[j] = groupAverage;
			}
		}
	}

	return noOutlierStream;
}
