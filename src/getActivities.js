const fetch = require("node-fetch");
const fs = require("fs");
const refreshToken = require("./refreshToken.js");

let options = {
	page: 1,
	per_page: 20,
};

/*
 * Uses access token to get activities
 * @param {object} res - JSON object containing access token
 */
async function getActivites() {
	const res = await refreshToken.reAuthorize();

	const activities_link = `https://www.strava.com/api/v3/athlete/activities?page=${options.page}&per_page=${options.per_page}&access_token=${res.access_token}`;

	if (res.message === "Bad Request") {
		console.log(res);
		return;
	}

	try {
		const result = await fetch(activities_link);

		if (result.message === "Bad Request") {
			console.log(result);
			return;
		}

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

getActivites();
