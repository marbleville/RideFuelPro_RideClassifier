const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const auth_link = "https://www.strava.com/api/v3/oauth/token";

/*
 * Uses access token to get activities
 * @param {object} res - JSON object containing access token
 */
async function getActivites(res) {
	const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}`;

	if (res.message === "Bad Request") {
		console.log(res);
		return;
	}

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

// Uses refresh token to get new access token, then calls getActivites
async function reAuthorize() {
	try {
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
		getActivites(json);
	} catch (error) {
		console.log(error);
	}
}

reAuthorize();
