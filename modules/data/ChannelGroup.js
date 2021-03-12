
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class ChannelGroup extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'channel_group',
        orderBy: 'name',
        fields: [
            { dbFieldName: 'id',          type: 'snowflake', nullable: false },
            { dbFieldName: 'type',        type: 'string',    nullable: false, length: 16, validValues: ['event-config', 'sync'] },
            { dbFieldName: 'name',        type: 'string',    nullable: false, length: 32 },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: false, refTableName: 'alliance' },
            { dbFieldName: 'event_id',    type: 'snowflake', nullable: true,  refTableName: 'event' },
            { dbFieldName: 'creator_id',  type: 'snowflake', nullable: false, refTableName: 'guardian' }
        ]
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
    
    static parseConditions(conditions) {
        if (conditions.channelId) {
            const Channel = require(`${ROOT}/modules/data/Channel`);
            return (query) => {
                query.where('type', conditions.type)
                    .where('alliance_id', conditions.allianceId)
                    .orWhereIn('id', function() {
                        this.select('id').from(Channel.schema.tableName).where('id', conditions.channelId);
                    });
            };
        }
        
        return conditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const channelGroup = await ChannelGroup.get({
            name: this.name,
            type: this.type,
            allianceId: this.allianceId,
            unique: true
        });
        
        // Check if this is a duplicate channelgroup
        if (channelGroup) {
            throw new DuplicateError(`There is already a channel group in this alliance of type ${this.type} called '${this.name}'`);
        }
        
        // Create the ID for this channel group and attempt to create it
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = ChannelGroup;
