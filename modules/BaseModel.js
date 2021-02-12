
// Load singletons
const knex = require('./Database.js');

class BaseModel {
    static tableName = null;
    
    constructor() {
    }
    
    static getTableName() {
        return this.tableName;
    }
    
    static get(conditions) {
        return null;
    }
}

module.exports = BaseModel;
