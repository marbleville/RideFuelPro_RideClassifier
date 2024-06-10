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
	ride.hills = findHills(ride, "uphill").concat(findHills(ride, "downhill"));

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
	ride.intervals = findIntervals(ride);

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
 * @param {String} setting - "uphill" or "downhill" to find up or down hills
 *
 * @returns {Array} - Array of hillEntries found in the ride
 */
function findHills(ride, setting) {
	if (!(setting === "uphill" || setting === "downhill")) {
		console.error("Invalid setting for findHills");
	}

	const MIN_GRADE = 0.02;
	const MIN_DISTANCE = 300;
	const MAX_FALSE_FLAT_DISTANCE = 200;
	const SEARCH_INCREMENT = 50;

	let hills = [];

	/**
	 * Algorithm to find hills:
	 * - Set a minimum grade for hills
	 * - Set a minimum distance for hills
	 * - Iterate through the altitude stream
	 * 		- At each point, check if the grade between the point 100m away is
	 * 		  greater than the minimum grade
	 * 		- If it is, store the idx of that point
	 *  	- Iterate through rest of points until the grade between points
	 * 		  flattens
	 * 			- Store this point and keep looking
	 * 			- If grade begins to go down or stays flat for 200m,
	 * 			  store this point as the end of the hill
	 * 		    - If not, keep looking
	 * - Calculate the distance, elevation gain, average gradient,
	 *   average speed, and average watts for each hill
	 * - Repeat for downhills
	 */
	for (
		let i = 0;
		i < ride.distance_stream.data.length;
		i = getIdxOfPointXMetersAhead(ride, i, SEARCH_INCREMENT)
	) {
		let hillStart = i;
		let idxMinDistMetersAhead = getIdxOfPointXMetersAhead(
			ride,
			i,
			MIN_DISTANCE
		);

		// If the end of the stream is reached
		if (idxMinDistMetersAhead === -1) {
			break;
		}

		// If the grade is not steep enough, continue
		let startGrade =
			(ride.altitude_stream.data[idxMinDistMetersAhead] -
				ride.altitude_stream.data[hillStart]) /
			(ride.distance_stream.data[idxMinDistMetersAhead] -
				ride.distance_stream.data[hillStart]);

		if (
			setting === "uphill"
				? startGrade <= MIN_GRADE
				: startGrade >= -MIN_GRADE
		) {
			continue;
		}

		// Find the end of the hill
		let hillEndFound = false;
		let hillEndIdx = -1;

		// Search hill in 50m increments
		for (
			let j = idxMinDistMetersAhead;
			!hillEndFound && j < ride.distance_stream.data.length;
			j = getIdxOfPointXMetersAhead(ride, j, SEARCH_INCREMENT)
		) {
			let segmentGrade =
				(ride.altitude_stream.data[
					getIdxOfPointXMetersAhead(ride, j, 50)
				] -
					ride.altitude_stream.data[j]) /
				(ride.distance_stream.data[
					getIdxOfPointXMetersAhead(ride, j, 50)
				] -
					ride.distance_stream.data[j]);

			// End of hill not found yet
			if (
				setting === "uphill"
					? segmentGrade >= MIN_GRADE
					: segmentGrade <= -MIN_GRADE
			) {
				continue;
			}

			// Check for false flat
			let idxFALSEFLATMetersAhead = getIdxOfPointXMetersAhead(
				ride,
				j,
				MAX_FALSE_FLAT_DISTANCE
			);
			let idxNextSegment = getIdxOfPointXMetersAhead(
				ride,
				idxFALSEFLATMetersAhead,
				MAX_FALSE_FLAT_DISTANCE + 50
			);

			// Calculate the grade of the 50m segment 200m ahead
			let nextSegmentGrade =
				(ride.altitude_stream.data[idxFALSEFLATMetersAhead] -
					ride.altitude_stream.data[idxNextSegment]) /
				(ride.distance_stream.data[idxFALSEFLATMetersAhead] -
					ride.distance_stream.data[idxNextSegment]);

			// If the grade is steep enough, continue
			if (
				setting === "uphill"
					? nextSegmentGrade >= MIN_GRADE
					: nextSegmentGrade <= -MIN_GRADE
			) {
				j = idxNextSegment;
				continue;
			}

			// If the grade is not steep enough, end the hill
			hillEndFound = true;
			hillEndIdx = j;

			// Push the starts and ends of the hills to the hills array
			let hill = Object.create(hillEntry);
			hill.idxStart = hillStart;
			hill.idxEnd = hillEndIdx;

			hills.push(hill);

			i = hillEndIdx;
		}
	}

	// fill in the rest of the hill values
	hills.map((hill) => {
		hill = getHillValues(hill, ride);
	});

	return hills;
}

/**
 * Given a hillEntry with a start and end index, calculates the distance,
 * elevation gain, average gradient, average speed, and average watts from the
 * rideEntry that contins this hill
 *
 * @param {hillEntry} hill - Hill object to calculate values for
 * @param {rideEntry} ride - Ride object whcih contains the given hill
 *
 * @returns {hillEntry} - Hill object with calculated values
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
