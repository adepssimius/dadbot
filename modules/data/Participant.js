
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Participant extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'participant',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'guardian_id',            type: 'snowflake', nullable: false, refTableName: 'guardian' },
            { dbFieldName: 'event_id',               type: 'snowflake', nullable: false, refTableName: 'event'    },
            { dbFieldName: 'joined_from_channel_id', type: 'snowflake', nullable: false, refTableName: 'channel'  },
            { dbFieldName: 'joined_from_guild_id',   type: 'snowflake', nullable: false, refTableName: 'guild'    },
            { dbFieldName: 'is_primary',             type: 'boolean',   nullable: false }
        ],
        primaryKey: ['guardian_id', 'event_id']
    });
        
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    // No custom getters required
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Nothing yet here, move along
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const participant = await Participant.get({
            guardianId: this.guardianId,
            eventId: this.eventId,
            unqiue: true
        });
        
        if (participant) {
            throw new DuplicateError(`Existing participating guardian found for this event: guardian_id = ${this.guardianId}, event id = ${this.event_id}`);
        }
        
        // Attempt to insert the record into the database
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = Participant;
