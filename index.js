const fetch = require("node-fetch");
require("dotenv").config();

const auth_link = "https://www.strava.com/api/v3/oauth/token";

async function getActivites(res) {
	const activities_link = `https://www.strava.com/api/v3/athlete/activities?access_token=${res.access_token}`;

	if (res.message === "Bad Request") {
		console.log(res);
		return;
	}

	try {
		const result = await fetch(activities_link);
		const json = await result.json();
		console.log(json);
	} catch (error) {
		console.log(error);
	}
}

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
