// START vega-demo.js
import vega from "vega";
import fs from "fs";
import sharp from "sharp";
import { rideEntry, hillEntry, intervalEntry } from "./types.js";

const graphWidthInPixels = 1920;
const graphHeightInPixels = 540;

// define a line chart
const lineChartSpec = {
	$schema: "https://vega.github.io/schema/vega/v5.json",
	description: "A basic line chart example.",
	width: graphWidthInPixels,
	height: graphHeightInPixels,
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
		{
			name: "mean_y",
			value: 0,
		},
	],

	data: [
		{
			name: "table",
			values: [],
		},
		{
			name: "hills",
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
		{
			orient: "bottom",
			scale: "x",
			title: "Distance (m)",
			titleFontSize: 50,
			titleColor: "steelblue",
			tickCount: 100,
			tickMinStep: 1000,
			labelFontSize: 20,
			labelColor: "lightgrey",
			labelOverlap: "parity",
		},
		{
			orient: "left",
			scale: "y",
			title: "Altitude (m)",
			titleFontSize: 50,
			titleColor: "steelblue",
			tickCount: 50,
			tickMinStep: 10,
			labelFontSize: 20,
			labelColor: "lightgrey",
			labelOverlap: "parity",
		},
	],

	marks: [
		{
			type: "rule",
			from: { data: "table" },
			encode: {
				enter: {
					stroke: { value: "red" },
					strokeWidth: { value: 3 },
					x: { value: 0 },
					y: { scale: "y", signal: "mean_y" },
					x2: { value: graphWidthInPixels },
					y2: { scale: "y", signal: "mean_y" },
					opacity: {
						expr: "datum[mean_y] == 0 ? 0 : 1",
					},
					sort: { value: "ascending" },
				},
			},
		},
		{
			type: "rect",
			from: { data: "hills" },
			encode: {
				enter: {
					x: { scale: "x", field: "xStart" },
					x2: { scale: "x", field: "xEnd" },
					y: { value: 0 },
					y2: { value: graphHeightInPixels },
					fill: { field: "color" },
					fillOpacity: { value: 0.5 },
				},
			},
		},
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
};

const intervalSpec = {
	xStart: 0,
	xEnd: 0,
	color: "red",
};

/**
 * Writes a PNG file of the given data stream with the given intervals
 * highlighted
 *
 * @param {Array<Number>} dataStream - The data stream to be graphed
 * @param {Array<Number>} distanceStream - The distance stream to be graphed
 * @param {Array<intervalSpec>} intervalSpecs - The intervals to be highlighted
 * @param {String} name - The name of the ride being graphed
 */
function drawDataStream(
	dataStream,
	distanceStream,
	intervalSpecs,
	name,
	ruleLine = 0
) {
	// Clone a new spec for the ride chart
	let rideChartSpec = JSON.parse(JSON.stringify(lineChartSpec));

	// Set each altitude and distance data point
	for (let i = 0; i < dataStream.length; i++) {
		let dataPoint = Object.create(dataPointSpec);
		dataPoint.x = distanceStream[i];
		dataPoint.y = dataStream[i];
		rideChartSpec.data[0].values.push(dataPoint);
	}

	// Add intervals to the chart
	for (let intervalSpec of intervalSpecs) {
		rideChartSpec.data[1].values.push(intervalSpec);
	}

	// Set the rule line
	rideChartSpec.signals[1].value = ruleLine;

	// create a new view instance for a given Vega JSON spec
	var view = new vega.View(vega.parse(rideChartSpec))
		.renderer("none")
		.initialize();

	// generate static PNG file from chart
	view.toSVG(1)
		.then(async function (svg) {
			await sharp(Buffer.from(svg))
				.toFormat("png")
				.toFile(`../rideGraphs/${name}.png`);
		})
		.catch(function (err) {
			console.error(err);
		});
}

/**
 * Writes a PNG file with the altitude graph of the given ride
 *
 * @param {rideEntry} ride - Ride object to be graphed
 */
export function drawRideAltitude(ride) {
	let dataStream = ride.altitude_stream;
	let distanceStream = ride.distance_stream;
	let intervalSpecs = [];

	for (let hill of ride.hills) {
		let interval = Object.create(intervalSpec);

		interval.xStart = distanceStream[hill.idxStart];
		interval.xEnd = distanceStream[hill.idxEnd];
		interval.color = hill.averageGradient > 0 ? "red" : "green";

		intervalSpecs.push(interval);
	}

	let name = ride.name.split(" ").join("-") + "AltitudeGraph";

	drawDataStream(dataStream, distanceStream, intervalSpecs, name);
}

/**
 * Writes a PNG file with the power graph of the given ride
 *
 * @param {rideEntry} ride - Ride object to be graphed
 */
export function drawRidePower(ride) {
	let dataStream = ride.power_stream;
	let distanceStream = ride.distance_stream;
	let intervalSpecs = [];

	for (let interval of ride.intervals) {
		let intervalSpecCopy = Object.create(intervalSpec);

		intervalSpecCopy.xStart = distanceStream[interval.idxStart];
		intervalSpecCopy.xEnd = distanceStream[interval.idxEnd];
		intervalSpecCopy.color = "red";

		intervalSpecs.push(intervalSpecCopy);
	}

	let name = ride.name.split(" ").join("-") + "PowerGraph";

	let sumWatts = ride.power_stream.reduce((a, b) => a + b, 0);
	let avgWatts = sumWatts / ride.power_stream.length;

	drawDataStream(dataStream, distanceStream, intervalSpecs, name, avgWatts);
}
