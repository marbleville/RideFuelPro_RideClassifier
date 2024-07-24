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

	const searchChunkSize = 50;

	let intervals = [];

	let powerStream = getCleanPowerStream(ride);

	for (
		let i = 0;
		i < powerStream.length - searchChunkSize;
		i += searchChunkSize
	) {
		let chunkAvgWatts = getIntervalAverageWatts(
			ride,
			i,
			i + searchChunkSize
		);

		if (chunkAvgWatts < config.intervalMinThreshold * ride.average_watts) {
			continue;
		}

		// interval found
		let intervalStart = i;
		let intervalEnd = i + searchChunkSize;

		// move start
		let searchStart = true;

		while (searchStart) {
			let newIntervalStart = intervalStart - 10;
			let newIntervalAvgWatts = getIntervalAverageWatts(
				ride,
				newIntervalStart,
				intervalEnd
			);
			if (newIntervalAvgWatts > chunkAvgWatts) {
				chunkAvgWatts = newIntervalAvgWatts;
				intervalStart = newIntervalStart;
			} else {
				searchStart = false;
			}
		}

		// move end
		let searchEnd = true;
		while (searchEnd) {
			let newIntervalEnd = intervalEnd + 10;
			let newIntervalAvgWatts = getIntervalAverageWatts(
				ride,
				intervalStart,
				newIntervalEnd
			);
			if (newIntervalAvgWatts > chunkAvgWatts) {
				chunkAvgWatts = newIntervalAvgWatts;
				intervalEnd = newIntervalEnd;
			} else {
				searchEnd = false;
			}
		}

		let interval = Object.create(intervalEntry);
		interval.idxStart = intervalStart;
		interval.idxEnd = intervalEnd;
		interval.averageWatts = chunkAvgWatts;

		intervals.push(interval);

		i = intervalEnd;
	}

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
	let intervalStream = ride.power_stream.slice(start, end);
	let sum = intervalStream.reduce((a, b) => a + b, 0);

	return sum / intervalStream.length;
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
