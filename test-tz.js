const { toZonedTime, fromZonedTime, formatInTimeZone } = require('date-fns-tz');
const { startOfDay } = require('date-fns');

const timeZone = 'Asia/Jakarta';
const now = new Date();
const zonedNow = toZonedTime(now, timeZone);
console.log('zonedNow:', zonedNow);
console.log('startOfDay:', startOfDay(zonedNow));
console.log('fromZonedTime:', fromZonedTime(startOfDay(zonedNow), timeZone).toISOString());
console.log('from string:', fromZonedTime('2023-10-01T00:00:00.000', timeZone).toISOString());
