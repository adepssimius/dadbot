
// Load our classes
const BaseModel        = require('../BaseModel.js');
const DuplicateError   = require('../error/DuplicateError');

// Load singletons
const client           = require('../Client.js'); // eslint-disable-line no-unused-vars

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
        
        data.sync_group_id = data.name;
        let result = await this._create(data); // eslint-disable-line no-unused-vars
        return new SyncGroup(data);
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async delete() {
        return await SyncGroup._delete({sync_group_id: this.name});
    }
}

module.exports = SyncGroup;
