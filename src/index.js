const fs = require("fs");
const api = require("./stravaAPI.js");

/**
 * Retuns an array of num activities
 * @param {number} num - Number of activities to write
 * @returns {Array} - Array of num activites
 */
async function getNumActivites(num) {
	let perPage = 10;
	let numPages = num % perPage;

	let activities = [];

	for (let i = 1; i <= numPages + 1; i++) {
		let json = await api.getActivites(perPage, i);
		activities = activities.concat(json);
		console.log(`Page ${i} fetched`);
	}

	return activities;
}

getNumActivites(10, "activities");
