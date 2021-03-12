
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const Guardian       = require(`${ROOT}/modules/data/Guardian`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Alliance extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'alliance',
        orderBy: 'name',
        fields: [
            { dbFieldName: 'id',         type: 'snowflake', nullable: false },
            { dbFieldName: 'name',       type: 'string',    nullable: false, length: 32 },
            { dbFieldName: 'short_name', type: 'string',    nullable: false, length: 4 },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false, refTableName: 'guardian' }
        ]
    });
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get title() {
        return `${this.name} [${this.shortName}]`;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        // Check for a name or short name search
        if (conditions.nameOrShortName) {
            return (query) => {
                query.where('name', conditions.name)
                    .orWhere('short_name', conditions.shortName.toUpperCase());
            };
        }
        
        // Check for a guild id search
        if (conditions.guildId) {
            const Guild = require(`${ROOT}/modules/data/Guild`);
            return (query) => {
                query.whereIn('id', function() {
                    this.select('alliance_id').from(Guild.schema.tableName).where('id', conditions.guildId);
                });
            };
        }
        
        // Handle any special fields
        let parsedConditions = conditions;
        
        if (parsedConditions.shortName) {
            parsedConditions.shortName = parsedConditions.shortName.toUpperCase();
        }
        
        return parsedConditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const alliance = await Alliance.get({
            nameOrShortName: true,
            name: this.name,
            shortName: this.shortName,
            unique: true
        });
        
        // Check if this is a duplicate alliance
        if (alliance) {
            throw new DuplicateError(`Existing alliance found with the same name or short name: ${this.title}`);
        }
        
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            //this.creator = new Guardian({id: this.creatorId});
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = Alliance;
