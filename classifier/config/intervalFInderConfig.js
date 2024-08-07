export default {
	smoothAlgGroupSize: 10, // the number of idx points to avg for the smooth algorithm
	removeOutliersGroupSize: 100, // the number of idx points to avg for the remove outliers algorithm
	searchChunkSize: 50, // the number of idx points to search by for an interval
	thresholdCoefficient: 2, // the coefficient to multiply the standard deviation by to determine an outlier
	intervalMinThreshold: 0.85, // the minimum threshold above rider FTP for an interval
	intervalMinTime: 30, // the minimum time in seconds for an interval
	intervalMaxGap: 30, // the maximum gap in seconds between intervals to combine them
};
