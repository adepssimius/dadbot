
// Determine our place in the world
const ROOT = '..';

class Timestamp {
    constructor(ts, tz = null) {
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
        const options = {
            dateStyle: 'full',
            timeStyle: 'long'
        };
        
        if (this.tz != null) {
            options.timeZone = this.tz;
        }
        
        const dateTimeFormat= new Intl.DateTimeFormat(undefined, options);
        return dateTimeFormat.format(this.ts);
    }
    
}

module.exports = Timestamp;
