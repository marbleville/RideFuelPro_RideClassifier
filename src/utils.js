/**
 * Returns the index of given stream stream that is the given number of the unit
 * of the stream ahead of the current idx or -1 if the end of the stream is
 * reached
 *
 * @param {Array<Number>} unitStream Distance stream of the ride
 * @param {Number} currentIdx - Current index in the ride to find the idx of
 * 								Xm ahead
 * @param {Number} value - Distance in meters to find the idx of
 *
 * @returns {Number} - Index of the altitude stream Xm ahead of the current
 * 					   index
 */
export function getIdxOfPointXUnitAhead(unitStream, currentIdx, value) {
	let currentLocation = unitStream[currentIdx];

	for (let i = currentIdx; i < unitStream.length; i++) {
		if (unitStream[i] - currentLocation >= value) {
			return i;
		}
	}

	return -1;
}

/**
 * Returns the average gradient of a hill given the altitude and distance
 * streams and the start and end indexes of the hill
 *
 * @param {Array<Number>} altitudeStream
 * @param {Array<Number>} distanceStream
 * @param {Number} idxStart
 * @param {Number} idxEnd
 *
 * @returns {Number} - The average gradient of the hill
 */
export function getGradient(altitudeStream, distanceStream, idxStart, idxEnd) {
	let altitudeChange = altitudeStream[idxEnd] - altitudeStream[idxStart];
	let distanceChange = distanceStream[idxEnd] - distanceStream[idxStart];

	return altitudeChange / distanceChange;
}
