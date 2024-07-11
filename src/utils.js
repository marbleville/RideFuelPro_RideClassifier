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
export function getIdxOfPointXMetersAhead(ride, currentIdx, distance) {
	let currentLocation = ride.distance_stream.data[currentIdx];

	for (let i = currentIdx; i < ride.distance_stream.data.length; i++) {
		if (ride.distance_stream.data[i] - currentLocation >= distance) {
			return i;
		}
	}

	return -1;
}
