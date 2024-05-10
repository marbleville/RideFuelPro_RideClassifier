// START vega-demo.js
var vega = require("vega");
var fs = require("fs");
const sharp = require("sharp");
const { rideEntry, typeOfRide } = require("./rideClassifier.js");

// define a line chart
const lineChartSpec = {
	$schema: "https://vega.github.io/schema/vega/v5.json",
	description: "A basic line chart example.",
	width: 500,
	height: 200,
	padding: 5,

	signals: [
		{
			name: "interpolate",
			value: "linear",
			bind: {
				input: "select",
				options: [
					"basis",
					"cardinal",
					"catmull-rom",
					"linear",
					"monotone",
					"natural",
					"step",
					"step-after",
					"step-before",
				],
			},
		},
	],

	data: [
		{
			name: "table",
			values: [],
		},
	],

	scales: [
		{
			name: "x",
			type: "point",
			range: "width",
			domain: { data: "table", field: "x" },
		},
		{
			name: "y",
			type: "linear",
			range: "height",
			nice: true,
			zero: true,
			domain: { data: "table", field: "y" },
		},
		{
			name: "color",
			type: "ordinal",
			range: "category",
			domain: { data: "table", field: "c" },
		},
	],

	axes: [
		{ orient: "bottom", scale: "x" },
		{ orient: "left", scale: "y" },
	],

	marks: [
		{
			type: "group",
			from: {
				facet: {
					name: "series",
					data: "table",
					groupby: "c",
				},
			},
			marks: [
				{
					type: "line",
					from: { data: "series" },
					encode: {
						enter: {
							x: { scale: "x", field: "x" },
							y: { scale: "y", field: "y" },
							stroke: { scale: "color", field: "c" },
							strokeWidth: { value: 2 },
						},
						update: {
							interpolate: { signal: "interpolate" },
							strokeOpacity: { value: 1 },
						},
						hover: {
							strokeOpacity: { value: 0.5 },
						},
					},
				},
			],
		},
	],
};

const dataPointSpec = {
	x: 0,
	y: 0,
	c: 0,
};

/**
 * Writes a PNG file with the alttiude graph of the given ride
 *
 * @param {rideEntry} ride - Ride object to be graphed
 */
function drawRideAltitude(ride) {
	// Clone a new spec for the ride chart
	let rideChartSpec = JSON.parse(JSON.stringify(lineChartSpec));

	for (altitudeValue in ride.altitude_stream) {
		let dataPoint = JSON.parse(JSON.stringify(dataPointSpec));
		dataPoint.x = ride.distance_stream[altitudeValue];
		dataPoint.y = ride.altitude_stream[altitudeValue];
		dataPoint.c = 0;
		rideChartSpec.data[0].values.push(dataPoint);
	}

	// create a new view instance for a given Vega JSON spec
	var view = new vega.View(vega.parse(lineChartSpec))
		.renderer("none")
		.initialize();

	// generate static PNG file from chart
	view.toSVG()
		.then(async function (svg) {
			await sharp(Buffer.from(svg))
				.toFormat("png")
				.toFile(`../rideGraphs/${ride.name}AltitudeGraph.png`);
		})
		.catch(function (err) {
			console.error(err);
		});
}

module.exports = { drawRideAltitude };
