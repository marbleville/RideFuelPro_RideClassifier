const fetch = require("node-fetch");
require("dotenv").config();

// Uses refresh token to get new access token
async function reAuthorize() {
	try {
		const auth_link = "https://www.strava.com/api/v3/oauth/token";
		const res = await fetch(auth_link, {
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

/*
 * Uses access token to get activities
 * @param {object} res - JSON object containing access token
 */
async function getActivites() {
	let options = {
		page: 1,
		per_page: 20,
	};

	const res = await refreshToken.reAuthorize();

	const activities_link = `https://www.strava.com/api/v3/athlete/activities?page=${options.page}&per_page=${options.per_page}&access_token=${res.access_token}`;

	try {
		const result = await fetch(activities_link);

		const json = await result.json();
		try {
			fs.writeFileSync(
				"./resources/activities.json",
				JSON.stringify(json)
			);
			// file written successfully
			console.log(`${json.length} Activities written to file`);
		} catch (err) {
			console.error(err);
		}
	} catch (error) {
		console.log(error);
	}
}

// Returns power stream for a given activity id
async function getActivityPowerStream(id) {
	try {
		const res = await reAuthorize();
		const power_link = `https://www.strava.com/api/v3/activities/${id}/streams?keys=[power]&key_by_type=true&access_token=${res.access_token}`;

		const result = await fetch(power_link);
		const json = await result.json();
		return json;
	} catch (error) {
		console.log(error);
	}
}

module.exports = { reAuthorize, getActivityPowerStream, getActivites };
