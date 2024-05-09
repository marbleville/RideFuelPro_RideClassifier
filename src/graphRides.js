// START vega-demo.js
var vega = require("vega");
var fs = require("fs");
const sharp = require("sharp");

var lineChartSpec = {
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
			values: [
				{ x: 0, y: 28, c: 0 },
				{ x: 1, y: 43, c: 0 },
				{ x: 2, y: 81, c: 0 },
				{ x: 3, y: 19, c: 0 },
				{ x: 4, y: 52, c: 0 },
				{ x: 5, y: 24, c: 0 },
				{ x: 6, y: 87, c: 0 },
				{ x: 7, y: 17, c: 0 },
				{ x: 8, y: 68, c: 0 },
				{ x: 9, y: 49, c: 0 },
			],
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

// create a new view instance for a given Vega JSON spec
var view = new vega.View(vega.parse(lineChartSpec))
	.renderer("none")
	.initialize();

// generate static PNG file from chart
view.toSVG()
	.then(async function (svg) {
		await sharp(Buffer.from(svg))
			.toFormat("png")
			.toFile("../rideGraphs/rideAltitude.png");
	})
	.catch(function (err) {
		console.error(err);
	});
// END vega-demo.js
