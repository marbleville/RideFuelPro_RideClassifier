import { typeOfRide, rideEntry } from ".types";

/**
 * Returns the type of ride based on the rideEntry object
 *
 * @param {rideEntry} ride - Ride object to be classfied
 * @param {Number} ftp - Rider's FTP
 *
 * @returns {String} - Ride type
 */
export function getRideType(ride, ftp) {
	return typeOfRide.unknown;
}
