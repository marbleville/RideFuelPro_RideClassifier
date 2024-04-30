const fs = require("fs");
const api = require("./stravaAPI.js");

/**
 * Retuns an array of num activities
 * @param {number} num - Number of cycling activities to write
 * @returns {Array} - Array of num activites
 */
async function getNumActivites(num) {
	let perPage = 10;
	let page = 1;

	let activities = [];

	while (activities.length < num) {
		let json = await api.getActivites(perPage, page);

		for (activity of json) {
			if (activity.type === "Ride") {
				activities.push(activity);
			}
			if (activities.length === num) {
				break;
			}
		}

		page++;
	}

	console.log(activities);
	return activities;
}
/**
 *  Returns an array of rides with only the necessary information and power streams added
 *
 * @param {Array} rides
 * @returns {Array} - Array of refactored rides
 */
function refactorRides(rides) {
	let rideEntry = {
		name: "",
		distance: 0,
		moving_time: 0,
		total_elevation_gain: 0,
		percent_up: 0,
		percent_down: 0,
		percent_flat: 0,
		average_uphill_gradient: 0,
		average_speed: 0,
		average_watts: 0,
		weighted_average_watts: 0,
		kilojoules: 0,
		average_heartrate: 0,
		power_stream: [],
		altitude_stream: [],
		workout_type: "",
	};

	let refactoredRides = [];
}

getNumActivites(10, "activities");
