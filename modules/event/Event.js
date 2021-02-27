
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel = require(`${ROOT}/modules/BaseModel`);
const Snowflake = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Event extends BaseModel {
    static tableName = 'event';
    
    constructor(data) {
        super({});
        this.data = data;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get id() {
        return this.data.id;
    }
    
    get activity_id() {
        return this.data.activity_id;
    }
    
    get category_id() {
        return this.data.category_id;
    }
    
    get alliance_id() {
        return this.data.alliance_id;
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
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set id(value) {
        this.data.id = value;
    }
    
    set activity_id(value) {
        this.data.activity_id = value;
    }
    
    set category_id(value) {
        this.data.category_id = value;
    }
    
    set alliance_id(value) {
        this.data.alliance_id = value;
    }
    
    set guild_id(value) {
        this.data.guild_id = value;
    }

    set platform(value) {
        this.data.platform = value;
    }

    set description(value) {
         this.data.description = value;
    }

    set start_time(value) {
        this.data.start_time = value;
    }

    set max_guardians(value) {
         this.data.max_guardians = value;
    }

    set estimated_mins(value) {
        this.data.estimated_mins = value;
    }

    set is_private(value) {
        this.data.is_private = value;
    }

    set auto_delete(value) {
        this.data.auto_delete = value;
    }

    set creator_id(value) {
        this.data.creator_id = value;
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
