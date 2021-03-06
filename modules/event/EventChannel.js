
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class EventChannel extends BaseModel {
    static tableName = 'event_channel';
    static orderBy   = 'created_at';
    static fields    = ['channel_id', 'event_id', 'guild_id', 'guild_name'];
    static fieldMap  = BaseModel.getFieldMap(EventChannel.fields);
    
    constructor(data) {
        super(EventChannel, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return EventChannel.tableName;
    }
    
    get channelId() {
        return this.data.channel_id;
    }
    
    get eventId() {
        return this.data.event_id;
    }
    
    get guildId() {
        return this.data.guild_id;
    }
    
    get guildName() {
        return this.data.guild_name;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set channelId(value) {
        this.data.channel_id = value;
    }
    
    set eventId(value) {
        this.data.event_id = value;
    }
    
    set guildId(value) {
        this.data.guild_id = value;
    }
    
    set guildName(value) {
        this.data.guild_name = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    //static parseConditions(conditions) {
    //    // Handle any special fields
    //    let parsedConditions = conditions;
    //    
    //    return parsedConditions;
    //}
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const eventChannel = await EventChannel.get({eventId: this.eventId, guildId: this.guildId, unique: true});
        
        if (eventChannel) {
            throw new DuplicateError(`There is already an event channel in that guild for this event: activity_id = ${this.activityId}, guild_id = ${this.guild_id}`);
        }
        
        // Attempt to insert the record into the database
        await BaseModel.prototype.create.call(this);
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getEvent() {
        if (this.event) {
            return this.event;
        }
        
        if (!this.eventId) {
            return null;
        }
        
        const Event = require(`${ROOT}/modules/event/Event`);
        const event = await Event.get({id: this.eventId, unique: true});
        
        if (!event) {
            throw new Error(`Unexpectedly did not find event with this id = '${this.eventId}'`);
        }
        
        return event;
    }
}

module.exports = EventChannel;
