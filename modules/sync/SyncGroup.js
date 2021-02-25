
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

//
// TODO - Clean up confusing usage of name vs sync_group_name
//

class SyncGroup extends BaseModel {
    static tableName = 'sync_group';
    
    constructor(data) {
        super(data);
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get sync_group_id() {
        return this.data.sync_group_id;
    }
    
    get name() {
        return this.data.name;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static async get(whereClause) {
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new SyncGroup(rows[x]));
        }
        
        return result;
    }
    
    static async create(data) {
        const syncGroups = await SyncGroup.get(data);
        
        if (syncGroups.length > 0) {
            throw new DuplicateError(`There is already a channel synchronization group called '${data.name}'`);
        }
        
        data.sync_group_id = Snowflake.generate();
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new SyncGroup(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await SyncGroup._delete({sync_group_id: this.sync_group_id});
    }
}

module.exports = SyncGroup;
