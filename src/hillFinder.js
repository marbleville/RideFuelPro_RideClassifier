import { hillEntry, rideEntry } from "./types.js";
import { getIdxOfPointXUnitAhead, getGradient } from "./utils.js";

/**
 * Finds hills (both up and down) in a ride and adds them to the ride object.
 * altitudeSteam and distanceStream are assumed to be the same length and values
 * at each index correspond to the same point in time.
 *
 * @param {Array<Number>} altitudeStream Altitude stream of the ride
 * @param {Array<Number>} distanceStream Distance stream of the ride
 *
 * @returns {Array} Array of hillEntries found in the ride
 */
export function findHills(altitudeStream, distanceStream) {
	let hills = [];

	let hillFragments = getHillFragments(altitudeStream, distanceStream);
	let cleanedHills = cleanHillFragments(
		altitudeStream,
		distanceStream,
		hillFragments
	);

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
 * @param {Array<Number>} altitudeStream Altitude stream of the ride
 * @param {Array<Number>} distanceStream Distance stream of the ride
 *
 * @returns {Array} - Array of tuples of the start and end indexs of hill
 * 					  fragments found in the ride
 */
function getHillFragments(altitudeStream, distanceStream) {
	let hillFragments = [];

	// true if looking for uphill hills, false if looking for downhill hills
	let gradientAscent = true;

	// Distance in meters to consider a false flat as part of a hill
	const falseFlatDistance = 50;

	let curIDX = 0;
	let startIDX = 0;

	/**
	 * Gradient ascent/descent
	 * Work idx by idx, but if altitude stopts going up/down, look
	 * `falseFlatDistance` ahead to see if it is a false flat
	 */
	while (curIDX < altitudeStream.length) {
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
						getIdxOfPointXUnitAhead(
							distanceStream,
							curIDX,
							falseFlatDistance
						)
				  ]
				: altitudeStream[curIDX] >
				  altitudeStream[
						getIdxOfPointXUnitAhead(
							distanceStream,
							curIDX,
							falseFlatDistance
						)
				  ]
		) {
			curIDX = getIdxOfPointXUnitAhead(
				distanceStream,
				curIDX,
				falseFlatDistance
			);
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
 * @param {Array<Number>} altitudeStream Altitude stream of the ride
 * @param {Array<Number>} distanceStream Distance stream of the ride
 * @param {Array<{idxStart, idxEnd}>} hillFragments
 *
 * @returns {Array} - Array of cleaned hill fragments
 */
function cleanHillFragments(altitudeStream, distanceStream, hillFragments) {
	const hillGap = 200;
	const minGradient = 0.02;

	let cleanedHills = [];
	// Remove hills that are under 3% gradient
	// Combine hills that are within like 200m of eahc otehr
	// Finally, remove hills that are under 200m long

	let culledHills = [];
	for (hill of hillFragments) {
		let gradient = getGradient(
			altitudeStream,
			distanceStream,
			hill.idxStart,
			hill.idxEnd
		);

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
			distanceStream[startOfNextHill] -
				distanceStream[endOfCurrentHill] <=
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
			distanceStream[hill.idxEnd] - distanceStream[hill.idxStart] >=
			200
		) {
			cleanedHills.push(hill);
		}
	}

	return cleanedHills;
}
