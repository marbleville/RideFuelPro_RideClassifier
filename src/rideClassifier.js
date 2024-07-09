const { id } = require("vega");
var LowpassFilter = require("lowpassf");

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

const intervalEntry = {
	idxStart: 0,
	idxEnd: 0,
	time: 0,
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
	intervals: [],
	workout_type: "",
};

/**
 * Returns the type of ride based on the rideEntry object
 *
 * @param {rideEntry} ride - Ride object to be classfied
 * @param {Number} ftp - Rider's FTP
 *
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
 * - intervals
 * - workout_type
 *
 * @param {rideEntry} ride - Ride object to calculate missing values for
 * @returns {rideEntry} - Ride object with missing values calculated
 */
function calculateMissingRideValues(ride, ftp) {
	// ride.hills = findHills(ride, "uphill").concat(findHills(ride, "downhill"));

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
 * Finds intervals in a ride and adds them to the ride object
 *
 * @param {rideEntry} ride - Ride object to find intervals from
 *
 * @returns {Array<intervalEntry>} - Array of interval objects found in the ride
 */
function findIntervals(ride) {
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

/**
 * Finds hills (both up and down) in a ride and adds them to the ride object
 *
 * @param {rideEntry} ride - Ride object to find hills from
 *
 * @returns {Array} - Array of hillEntries found in the ride
 */
function findHills(ride) {
	let hills = [];

	let hillFragments = getHillFragments(ride);
	let cleanedHills = cleanHillFragments(ride, hillFragments);

	for (let hill of cleanedHills) {
		let hillEntry = Object.create(hillEntry);
		hillEntry.idxStart = hill.idxStart;
		hillEntry.idxEnd = hill.idxEnd;
		getHillValues(hillEntry, ride);
		hills.push(hillEntry);
	}

	return hills;
}

/**
 * Finds hill fragments (both up and down) in a ride and returns an array of
 * the start and end indexes of the hills
 *
 * @param {rideEntry} ride - Ride object to find hills from
 *
 * @returns {Array} - Array of tuples of the start and end indexs of hill
 * 					  fragments found in the ride
 */
function getHillFragments(ride) {
	let hillFragments = [];

	// true if looking for uphill hills, false if looking for downhill hills
	let gradientAscent = true;

	// Distance in meters to consider a false flat as part of a hill
	let falseFlatDistance = 50;

	let curIDX = 0;
	let startIDX = 0;

	let altitudeStream = ride.altitude_stream.data;

	/**
	 * Gradient ascent/descent
	 * Work idx by idx, but if altitude stopts going up/down, look
	 * `falseFlatDistance` ahead to see if it is a false flat
	 */
	while (curIDX < ride.altitude_stream.data.length) {
		if (curIDX >= altitudeStream.length - 1) {
			break;
		}

		if (
			gradientAscent
				? altitudeStream[curIDX] < altitudeStream[curIDX + 1]
				: altitudeStream[curIDX] > altitudeStream[curIDX + 1]
		) {
			curIDX++;
			continue;
		} else if (
			// Look ahead for false flat
			gradientAscent
				? altitudeStream[curIDX] <
				  altitudeStream[
						getIdxOfPointXMetersAhead(
							ride,
							curIDX,
							falseFlatDistance
						)
				  ]
				: altitudeStream[curIDX] >
				  altitudeStream[
						getIdxOfPointXMetersAhead(
							ride,
							curIDX,
							falseFlatDistance
						)
				  ]
		) {
			curIDX = getIdxOfPointXMetersAhead(ride, curIDX, falseFlatDistance);
			continue;
		} else {
			// Found the end of the hill
			hillFragments.push({ idxStart: startIDX, idxEnd: curIDX });
			startIDX = curIDX;
			gradientAscent = !gradientAscent;
		}
	}

	return hillFragments;
}

/**
 * Cleans the hill fragments of a ride by removing any fragments that are too
 * short or shallow and combining hill that are likley together
 *
 * @param {rideEntry} ride
 * @param {Array<{idxStart, idxEnd}>} hillFragments
 *
 * @returns {Array} - Array of cleaned hill fragments
 */
function cleanHillFragments(ride, hillFragments) {
	const hillGap = `200`;

	let cleanedHills = [];
	// Remove hills that are under 3% gradient
	// Combine hills that are within like 200m of eahc otehr
	// Finally, remove hills that are under 200m long

	let culledHills = [];
	for (hill of hillFragments) {
		if (
			(ride.altitude_stream.data[hill.idxEnd] -
				ride.altitude_stream.data[hill.idxStart]) /
				(ride.distance_stream.data[hill.idxEnd] -
					ride.distance_stream.data[hill.idxStart]) >
			0.03
		) {
			culledHills.push(hill);
		}
	}

	let combinedHills = [];
	let curHillIDX = 0;

	while (curHillIDX < culledHills.length - 1) {
		let endOfCurrentHill = culledHills[curHillIDX].idxEnd;
		let startOfNextHill = culledHills[curHillIDX + 1].idxStart;

		if (
			ride.distance_stream.data[startOfNextHill] -
				ride.distance_stream.data[endOfCurrentHill] <=
			hillGap
		) {
			combinedHills.push({
				idxStart: culledHills[curHillIDX].idxStart,
				idxEnd: culledHills[curHillIDX + 1].idxEnd,
			});
			curHillIDX++;
		}
	}

	for (let hill of combinedHills) {
		if (
			ride.distance_stream.data[hill.idxEnd] -
				ride.distance_stream.data[hill.idxStart] >=
			200
		) {
			cleanedHills.push(hill);
		}
	}

	return cleanedHills;
}

/**
 * Given a hillEntry with a start and end index, calculates the distance,
 * elevation gain, average gradient, average speed, and average watts from the
 * rideEntry that contins this hill
 *
 * @param {hillEntry} hill - Hill object to calculate values for
 * @param {rideEntry} ride - Ride object whcih contains the given hill
 */
function getHillValues(hill, ride) {
	hill.distance =
		ride.distance_stream.data[hill.idxEnd] -
		ride.distance_stream.data[hill.idxStart];

	hill.elevationGain =
		ride.altitude_stream.data[hill.idxEnd] -
		ride.altitude_stream.data[hill.idxStart];

	hill.averageGradient =
		(ride.altitude_stream.data[hill.idxEnd] -
			ride.altitude_stream.data[hill.idxStart]) /
		(ride.distance_stream.data[hill.idxEnd] -
			ride.distance_stream.data[hill.idxStart]);

	hill.averageSpeed =
		hill.distance /
		(ride.time_stream.data[hill.idxEnd] -
			ride.time_stream.data[hill.idxStart]);

	hill.averageWatts = 0;
	let idxDifferece = hill.idxEnd - hill.idxStart;

	for (let i = hill.idxStart; i < hill.idxEnd; i++) {
		hill.averageWatts += ride.power_stream.data[i] / idxDifferece;
	}
}

/**
 * Returns the index of the altitude stream that is the given number of meters
 * ahead of the current idx or -1 if the end of the stream is reached before
 *
 * @param {rideEntry} ride - Ride object to find idx from
 * @param {Number} currentIdx - Current index in the ride to find the idx of
 * 								Xm ahead
 * @param {Number} distance - Distance in meters to find the idx of
 *
 * @returns {Number} - Index of the altitude stream Xm ahead of the current
 * 					   index
 */
function getIdxOfPointXMetersAhead(ride, currentIdx, distance) {
	let currentLocation = ride.distance_stream.data[currentIdx];

	for (let i = currentIdx; i < ride.distance_stream.data.length; i++) {
		if (ride.distance_stream.data[i] - currentLocation >= distance) {
			return i;
		}
	}

	return -1;
}

module.exports = {
	rideEntry,
	typeOfRide,
	hillEntry,
	calculateMissingRideValues,
	findHills,
	getCleanPowerStream,
};
