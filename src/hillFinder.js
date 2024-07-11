export function findHills() {}

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
		let hillEnt = Object.create(hillEntry);
		hillEnt.idxStart = hill.idxStart;
		hillEnt.idxEnd = hill.idxEnd;
		getHillValues(hillEnt, ride);
		hills.push(hillEnt);
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
	const falseFlatDistance = 50;

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
			curIDX++;
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
	const hillGap = 200;
	const minGradient = 0.02;

	let cleanedHills = [];
	// Remove hills that are under 3% gradient
	// Combine hills that are within like 200m of eahc otehr
	// Finally, remove hills that are under 200m long

	let culledHills = [];
	for (hill of hillFragments) {
		let gradient =
			(ride.altitude_stream.data[hill.idxEnd] -
				ride.altitude_stream.data[hill.idxStart]) /
			(ride.distance_stream.data[hill.idxEnd] -
				ride.distance_stream.data[hill.idxStart]);

		if (
			!Number.isNaN(gradient) &&
			(gradient > minGradient || gradient < -minGradient)
		) {
			// console.log(gradient);
			culledHills.push(hill);
			continue;
		}
	}

	let combinedHills = [];
	let curCulledHillIDX = 1;
	let currentHill = culledHills[0];

	while (curCulledHillIDX < culledHills.length - 1) {
		let endOfCurrentHill = currentHill.idxEnd;
		let startOfNextHill = culledHills[curCulledHillIDX].idxStart;

		// fix combining hills of different gradients
		if (
			ride.distance_stream.data[startOfNextHill] -
				ride.distance_stream.data[endOfCurrentHill] <=
			hillGap
		) {
			currentHill.idxEnd = culledHills[curCulledHillIDX].idxEnd;
			curCulledHillIDX++;
		} else {
			combinedHills.push(currentHill);
			curCulledHillIDX++;
			currentHill = culledHills[curCulledHillIDX];
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
