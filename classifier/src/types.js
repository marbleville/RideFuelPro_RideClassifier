// Object contianing the different types of rides
export const typeOfRide = {
	intervals: "Intervals",
	endurance: "Endurance",
	race: "Race",
	rest: "Rest",
	unknown: "Unknown",
};

// Object containing a hill's associated data
export const hillEntry = {
	idxStart: 0,
	idxEnd: 0,
	distance: 0,
	elevationGain: 0,
	averageGradient: 0,
	averageSpeed: 0,
	averageWatts: 0,
};

export const intervalEntry = {
	idxStart: 0,
	idxEnd: 0,
	time: 0,
	averageWatts: 0,
};

// Object containing a ride's assiciated data
export const rideEntry = {
	name: "",
	distance: 0,
	moving_time: 0,
	total_elevation_gain: 0,
	percent_up: 0,
	percent_down: 0,
	percent_flat: 0,
	average_uphill_gradient: 0,
	average_speed_uphill: 0,
	average_speed_downhill: 0,
	average_speed_flat: 0,
	average_speed: 0,
	average_watts: 0,
	average_watts_uphill: 0,
	average_watts_downhill: 0,
	average_watts_flat: 0,
	weighted_average_watts: 0,
	kilojoules: 0,
	average_heartrate: 0,
	power_stream: [],
	altitude_stream: [],
	distance_stream: [],
	time_stream: [],
	hills: [],
	intervals: [],
	workout_type: "",
};
