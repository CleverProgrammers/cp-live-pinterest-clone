import * as api from '@opentelemetry/api';
/**
 * Returns an hrtime calculated via performance component.
 * @param performanceNow
 */
export declare function hrTime(performanceNow?: number): api.HrTime;
/**
 *
 * Converts a TimeInput to an HrTime, defaults to _hrtime().
 * @param time
 */
export declare function timeInputToHrTime(time: api.TimeInput): api.HrTime;
/**
 * Returns a duration of two hrTime.
 * @param startTime
 * @param endTime
 */
export declare function hrTimeDuration(startTime: api.HrTime, endTime: api.HrTime): api.HrTime;
/**
 * Convert hrTime to timestamp, for example "2019-05-14T17:00:00.000123456Z"
 * @param hrTime
 */
export declare function hrTimeToTimeStamp(hrTime: api.HrTime): string;
/**
 * Convert hrTime to nanoseconds.
 * @param hrTime
 */
export declare function hrTimeToNanoseconds(hrTime: api.HrTime): number;
/**
 * Convert hrTime to milliseconds.
 * @param hrTime
 */
export declare function hrTimeToMilliseconds(hrTime: api.HrTime): number;
/**
 * Convert hrTime to microseconds.
 * @param hrTime
 */
export declare function hrTimeToMicroseconds(hrTime: api.HrTime): number;
/**
 * check if time is HrTime
 * @param value
 */
export declare function isTimeInputHrTime(value: unknown): boolean;
/**
 * check if input value is a correct types.TimeInput
 * @param value
 */
export declare function isTimeInput(value: unknown): boolean;
//# sourceMappingURL=time.d.ts.map