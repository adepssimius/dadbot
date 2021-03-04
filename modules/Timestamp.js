
// Determine our place in the world
const ROOT = '..';

class Timestamp {
    //constructor(ts, tz = null) {
    constructor(ts = new Date(), tz = 'America/New_York') {
        // Validate the provided timestamp
        // This works because getTime() returns NaN when the date is invalid, NaN is always not equal to NaN
        if (ts.getTime() != ts.getTime() || ts == 'Invalid Date') {
            throw new Error(`Invalid datetime: ${ts}`);
        }
        
        // Validate the timezone (TODO - Figure out how to do this)
        
        this.ts = ts;
        this.tz = tz;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get ts() {
        return this.timestampValue;
    }
    
    get tz() {
        return this.timeZoneValue;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set ts(value) {
        this.timestampValue = value;
    }
    
    set tz(value) {
        if ( (value != null) && !Timestamp.timeZoneIsValid(value)) {
            throw new Error('Invalid time zone');
        }
        this.timeZoneValue = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static timeZoneIsValid(tz) {
        if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
            throw 'Time zones are not available in this environment';
        }
    
        try {
            Intl.DateTimeFormat(undefined, {timeZone: tz});
            return true;
        } catch (ex) {
            return false;
        }
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    convert() {
        const options = {dateStyle: 'full', timeStyle: 'long'};
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).format(this.ts);
    }
    
    formatDate(dateStyle = 'full') {
        const options = {dateStyle: dateStyle};
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).format(this.ts);
    }
    
    getWeekdayName() {
        const options = {weekday: 'long'};
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).format(this.ts);
    }
    
    getMenuOption(daysFromToday) {
        const date = this.addDays(daysFromToday);
        
        switch (daysFromToday) {
            case 0: return 'Today';
            case 1: return 'Tomorrow';
            default: return date.formatDate();
        }
    }
    
    addDays(days) {
        let date = new Date(this.ts);
        date.setDate(date.getDate() + days);
        return new Timestamp(date, this.tz);
    }
    
    channelString() {
        const options = {dayPeriod: 'long'};
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).format(this.ts);
    }
    
    getTimezone() {
        const options = {timeZoneName: 'short'};
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).format(this.ts);
    }
    
    formatToParts() {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
            hour12: true,
            timeZone: 'short',
            timeZoneName: 'short'
        };
        
        if (this.tz != null) options.timeZone = this.tz;
        return new Intl.DateTimeFormat(undefined, options).formatToParts(this.ts);
    }
}

module.exports = Timestamp;
