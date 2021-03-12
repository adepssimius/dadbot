
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel = require(`${ROOT}/modules/BaseModel`);
const Snowflake = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class UserFriendlyId extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'user_friendly_id',
        orderBy: 'created_at',
        fields: [
            { dbFieldName: 'id',         type: 'snowflake', nullable: false },
            { dbFieldName: 'type',       type: 'string',    nullable: false, length: 16,},
            { dbFieldName: 'ufid',       type: 'string',    nullable: false, length: 8 },
            { dbFieldName: 'object_id',  type: 'string',    nullable: true,  length: 20 },
            { dbFieldName: 'prefix',     type: 'string',    nullable: true,  length: 1 },
            { dbFieldName: 'digits',     type: 'integer',   nullable: false },
            { dbFieldName: 'status',     type: 'string',    nullable: false, length: 16 },
            { dbFieldName: 'is_active',  type: 'boolean',   nullable: false },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false, refTableName: 'guardian' }
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
    
    // Nothing yet here, move along
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const attempts = 10;
        
        // Generate a ufid and then check if there is already an active record in the database
        // Try again a few times if that ufid already exists, eventually quitting
        for (let x = 0; x < attempts; x++) {
            this.ufid = this.generate();
            
            const duplicateQuery = {
                type: this.type,
                ufid: this.ufid,
                isActive: true,
                unique: true
            };
            
            const duplicate = await UserFriendlyId.get(duplicateQuery);
            
            if (!duplicate) break;
            this.ufid = null;
        }
        
        // If after all those attempts we have not found a duplicate, then quit before the universe explodes
        if (!this.ufid) {
            throw new Error(`Shocking, ${attempts} attempts to generate a unique user friendly id failed`);
        }
        
        // Generate id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    generate() {
        const randnum = Math.random();
        const min  = Math.pow(10, this.digits - 1);
        const max  = Math.pow(10, this.digits) - 1;
        
        return `${this.prefix}${Math.floor(randnum * (max - min + 1) + min)}`;
    }
}

module.exports = UserFriendlyId;
