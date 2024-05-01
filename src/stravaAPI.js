const fetch = require("node-fetch");
require("dotenv").config();

/**
 * Uses refresh token to get new access token
 *
 * @returns {Promise} - Promise object represents the JSON of the new access token
 */
async function reAuthorize() {
	try {
		const authLink = "https://www.strava.com/api/v3/oauth/token";
		// Fetch new access token
		const res = await fetch(authLink, {
			method: "post",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
			},

			body: JSON.stringify({
				client_id: `${process.env.STRAVA_CLIENT_ID}`,
				client_secret: `${process.env.STRAVA_CLIENT_SECRET}`,
				refresh_token: `${process.env.STRAVA_REFRESH_TOKEN}`,
				grant_type: "refresh_token",
			}),
		});
		const json = await res.json();
		return json;
	} catch (error) {
		console.log(error);
	}
}

async function checkAccessTokenExpiration() {
	// Check if access token has expired
	if (Date.now() / 1000 > process.env.STRAVA_ACCESS_TOKEN_EXPIRES_AT) {
		const res = await reAuthorize();
		process.env.STRAVA_ACCESS_TOKEN = res.access_token;
		process.env.STRAVA_ACCESS_TOKEN_EXPIRES_AT = res.expires_at;
	}
}

/**
 * Uses access token to get activities
 *
 * @param {number} perPage - Number of activities per page
 * @param {number} page - Page number
 * @returns {Promise} - Promise object represents the JSON of activities
 */
async function getActivites(perPage, page) {
	await checkAccessTokenExpiration();
	const activitiesLink = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}&access_token=${process.env.STRAVA_ACCESS_TOKEN}`;

	try {
		// Fetch activities
		const result = await fetch(activitiesLink);
		const json = await result.json();
		return json;
	} catch (error) {
		console.log(error);
	}
}

/**
 * Returns power stream for a given activity id
 *
 * @param {number} id - Activity id
 * @returns {Promise} - Promise object represents the JSON of the power stream
 */
async function getActivityStreams(id) {
	await checkAccessTokenExpiration();
	const streamLink = `https://www.strava.com/api/v3/activities/${id}/streams?keys=watts,altitude,time&key_by_type=true&access_token=${process.env.STRAVA_ACCESS_TOKEN}`;

	try {
		// Fetch power stream
		const result = await fetch(streamLink);
		const json = await result.json();
		return json;
	} catch (error) {
		console.log(error);
	}
}

module.exports = {
	reAuthorize,
	getActivityStreams,
	getActivites,
};
