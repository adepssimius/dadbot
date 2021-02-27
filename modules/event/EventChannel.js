
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class EventChannel extends BaseModel {
    static tableName = 'event_channel';
    
    constructor(data) {
        super({});
        this.data = data;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get channel_id() {
        return this.data.channel_id;
    }
    
    get event_id() {
        return this.data.activity_id;
    }
    
    get channel_guild_id() {
        return this.data.channel_guild_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set channel_id(value) {
        this.data.channel_id = value;
    }
    
    set event_id(value) {
        this.data.activity_id = value;
    }
    
    set channel_guild_id(value) {
        this.data.channel_guild_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new EventChannel(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        // TODO - Figure out if there is some sort of duplicate check we should do for these (I think not)
        const eventChannels = await EventChannel.get(data);
        
        if (eventChannels.length > 0) {
            throw new DuplicateError(`There is already an event channel with the ID ${data.channel_id}`);
        }
        
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new EventChannel(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await EventChannel._delete({channel_id: this.channel_id});
    }
}

module.exports = EventChannel;
