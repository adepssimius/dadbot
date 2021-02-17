
// Load our classes
const BaseModel = require('../BaseModel.js');
const Snowflake = require('../Snowflake');

// Load singletons
const client = require('../Client.js'); // eslint-disable-line no-unused-vars

class Event extends BaseModel {
    static tableName = 'event';
    
    constructor(data) {
        super(data);
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get event_id() {
        return this.data.activity_id;
    }
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get category_id() {
        return this.data.category_id;
    }
    
    get guild_id() {
        return this.data.guild_id;
    }

    get platform() {
        return this.data.platform;
    }

    get description() {
        return this.data.description;
    }

    get start_time() {
        return this.data.start_time;
    }

    get max_guardians() {
        return this.data.max_guardians;
    }

    get estimated_mins() {
        return this.data.estimated_mins;
    }

    get is_private() {
        return this.data.is_private;
    }

    get auto_delete() {
        return this.data.auto_delete;
    }

    get creator_id() {
        return this.data.creator_id;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Event(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        // TODO - Figure out if there is some sort of duplicate check we should do for these (I think not)
        //const events = await Event.get(data);
        //
        //if (Event.length > 0) {
        //    throw new DuplicateError(`There is already an event called '${data.activity_name}'`);
        //}
        
        data.event_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Event(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await Event._delete({event_id: this.event_id});
    }
}

module.exports = Event;
