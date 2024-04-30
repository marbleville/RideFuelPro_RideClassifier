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

async function getActivityPowerStream(id) {
	const res = await reAuthorize();
	const power_link = `https://www.strava.com/api/v3/activities/${id}/streams`; //?power?access_token=${res.access_token}`;

	const result = await fetch(power_link, {
		method: "get",
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json",
		},

		body: JSON.stringify({
			keys: `[power]`,
			key_by_type: `true`,
		}),
	});
	const json = await result.json();
	return json;
}

module.exports = { reAuthorize, getActivityPowerStream };
