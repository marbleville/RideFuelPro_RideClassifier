import { intervalEntry, rideEntry } from "./types.js";
import config from "../config/intervalFinderConfig.js";

/**
 * Finds intervals in a ride and adds them to the ride object
 *
 * @param {rideEntry} ride - Ride object to find intervals from
 *
 * @returns {Array<intervalEntry>} - Array of interval objects found in the ride
 */
export function findIntervals(ride, ftp) {
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

	const searchChunkSize = config.searchChunkSize;

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

		if (chunkAvgWatts < config.intervalMinThreshold * ftp) {
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

		intervals.push(interval);

		i = intervalEnd;
	}

	// add cleanup pass to stick nearby intervals together

	return cleanIntervals(ride, intervals);
}

/**
 * Cleans a set of intervals by merging intervals that are too close together 
 * and removing intervals that are too short
 * 
 * @param {rideEntry} ride the ride to clean intervals from
 * @param {Array<intervalEntry>} intervals the set of intervals to clean
 * 
 * @returns {Array<intervalEntry>} the cleaned set of intervals
 
 */
function cleanIntervals(ride, intervals) {
	let mergedIntervals = [];

	let currentInterval = intervals[0];

	for (let i = 0; i < intervals.length - 1; i++) {
		let intervalEnd = intervals[i].idxEnd;
		let nextIntervalStart = intervals[i + 1].idxStart;

		let timeBetweenIntervals = getTimeOfInterval(
			ride,
			intervalEnd,
			nextIntervalStart
		);

		if (timeBetweenIntervals < config.intervalMaxGap) {
			currentInterval.idxEnd = intervals[i + 1].idxEnd;
		} else {
			currentInterval.time = getTimeOfInterval(
				ride,
				currentInterval.idxStart,
				currentInterval.idxEnd
			);
			currentInterval.averageWatts = getIntervalAverageWatts(
				ride,
				currentInterval.idxStart,
				currentInterval.idxEnd
			);
			mergedIntervals.push(currentInterval);
			currentInterval = intervals[i + 1];
		}
	}

	let culledIntervals = mergedIntervals.filter(
		(interval) =>
			getTimeOfInterval(ride, interval.idxStart, interval.idxEnd) >
			config.intervalMinTime
	);

	return culledIntervals;
}

/**
 * Returns the time of an interval in a ride in seconds
 *
 * @param {rideEntry} ride the ride to get interval time for
 * @param {NUmber} intervalStart the index of the start of the interval
 * @param {Number} intervalEnd the index of the end of the interval
 *
 * @returns {NUmber} the time of the interval in seconds
 */
function getTimeOfInterval(ride, intervalStart, intervalEnd) {
	let timeStart = ride.time_stream[intervalStart];
	let timeEnd = ride.time_stream[intervalEnd];

	return timeEnd - timeStart;
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
