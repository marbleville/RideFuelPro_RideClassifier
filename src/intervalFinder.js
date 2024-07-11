import { intervalEntry, rideEntry } from ".types";

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

	for (let i = 0; i < ride.power_stream.data.length; i += SEARCH_INCREMENT) {
		// If the end of the stream is reached
		if (i + SEARCH_INCREMENT >= ride.power_stream.data.length) {
			break;
		}

		let intervalStart = i;
		let intervalEnd = i + SEARCH_INCREMENT;

		// If the average watts are not high enough, continue
		let intervalAverageWatts = getIntervalAverageWatts(
			ride,
			intervalStart,
			intervalEnd
		);

		if (intervalAverageWatts < ride.average_watts * INTERVAL_THRESHOLD) {
			continue;
		}

		let greedySearch = true;
		while (greedySearch) {}
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
function getCleanPowerStream(ride) {
	var filter = new LowpassFilter();
	let noOutliersPowerStream = [...ride.power_stream.data];

	// remove outliers
	for (let i = 0; i < noOutliersPowerStream.length; i++) {
		if (noOutliersPowerStream[i] < 50) {
			noOutliersPowerStream[i] = ride.average_watts;
		}

		if (
			noOutliersPowerStream[i] > ride.average_watts &&
			noOutliersPowerStream[i] < ride.average_watts * 1.3
		) {
			noOutliersPowerStream[i] = ride.average_watts;
		}
	}

	let cleanPowerStream = [];

	filter.setLogic(filter.LinearWeightAverage);
	for (let i = 0; i < noOutliersPowerStream.length; i++) {
		//put current value
		filter.putValue(noOutliersPowerStream[i]);
		//Get the latest calculated moving average of the values putted so far
		var filteredValue = filter.getFilteredValue();
		cleanPowerStream.push(filteredValue);
	}

	// average the power stream in 20 index increments
	let averagedPowerStream = [];
	let sum = 0;
	let count = 0;
	for (let i = 0; i < cleanPowerStream.length; i++) {
		sum += cleanPowerStream[i];
		count++;

		if (count === 20) {
			averagedPowerStream.push(sum / 20);
			sum = 0;
			count = 0;
		}
	}

	return averagedPowerStream;
}
