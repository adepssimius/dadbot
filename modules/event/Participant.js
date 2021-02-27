
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Participant extends BaseModel {
    static tableName = 'event';
    
    constructor(data) {
        super({});
        this.data = data;
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get guardian_id() {
        return this.data.guardian_id;
    }
    
    get event_id() {
        return this.data.event_id;
    }
    
    get joined_from_channel_id() {
        return this.data.channel_id;
    }
    
    get joined_from_guild_id() {
        return this.data.joined_from_guild_id;
    }
    
    get is_primary() {
        return this.data.is_primary;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new Participant(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        // TODO - Figure out if there is some sort of duplicate check we should do for these (I think not)
        const participants = await Participant.get(data);
        
        if (participants.length > 0) {
            throw new DuplicateError(`There is already a participant with the guardian ID ${data.guardian_id} and event ID ${data.event_id}`);
        }
        
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new Participant(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await Participant._delete({guardian_id: this.guardian_id, event_id: this.event_id});
    }
}

module.exports = Participant;
