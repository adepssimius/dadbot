
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Load the database client
const knex = require('knex')(client.config.database);

// Set some colors
const chalk = require('chalk');
const colorizeTable   = chalk.cyan;
const colorizeField   = chalk.green;
const colorizeType    = chalk.yellow;
const colorizeNotNull = chalk.red;
const colorizeFkName  = chalk.magenta;

console.log('Connected to database');

knex.ninkasiDatabaseInit = async () => {
    client.logger.log(`Checking database schema`);
    
    const Tables = [
        require(`${ROOT}/modules/data/Guardian`),
        require(`${ROOT}/modules/data/Alliance`),
        require(`${ROOT}/modules/data/Guild`),
        require(`${ROOT}/modules/data/Parameter`),
        require(`${ROOT}/modules/data/ActivityCategory`),
        require(`${ROOT}/modules/data/Activity`),
        require(`${ROOT}/modules/data/ActivityAlias`),
        require(`${ROOT}/modules/data/Event`),
        require(`${ROOT}/modules/data/ChannelGroup`),
        require(`${ROOT}/modules/data/Channel`),
        require(`${ROOT}/modules/data/Message`),
        require(`${ROOT}/modules/data/Participant`),
        require(`${ROOT}/modules/data/UserFriendlyId`)
    ];
    
    for (let t = 0; t < Tables.length; t++) {
        await knex.createNinkasiTable(Tables[t]);
    }
};

knex.createNinkasiTable = async (TableClass) => {
    await knex.schema.hasTable(TableClass.schema.tableName).then(async function(exists) {
        if (exists) {
            client.logger.log(`  -> Skipping table: ${colorizeTable(TableClass.schema.tableName)} (already exists)`);
        } else {
            await knex.schema.createTable(TableClass.schema.tableName, async function (table) {
                
                for (let f = 0; f < TableClass.schema.fields.length; f++) {
                    const field = TableClass.schema.fields[f];
                    
                    if (field.dbFieldName == 'created_at' || field.dbFieldName == 'updated_at') {
                        continue;
                    }
                    
                    const typeString = field.type + (field.type == 'string' ? `(${field.length})` : '');
                    const fieldDescription = colorizeType(typeString)
                                         + ` ${colorizeField(field.dbFieldName)}`
                                         + (!field.nullable ? colorizeNotNull(' NOT NULL') : '');
                    
                    client.logger.log(`       -> Adding column: ${fieldDescription}`);
                    
                    if (field.nullable) {
                        switch (field.type) {
                            case 'snowflake': table.string   (field.dbFieldName, 20); break;
                            case 'string'   : table.string   (field.dbFieldName, field.length); break;
                            case 'boolean'  : table.boolean  (field.dbFieldName); break;
                            case 'integer'  : table.integer  (field.dbFieldName); break;
                            case 'datetime' : table.timestamp(field.dbFieldName); break;
                            default: throw new RangeError(`Invalid field type: ${field.type}`);
                        }
                    } else {
                        switch (field.type) {
                            case 'snowflake': table.string   (field.dbFieldName, 20).notNullable(); break;
                            case 'string'   : table.string   (field.dbFieldName, field.length).notNullable(); break;
                            case 'boolean'  : table.boolean  (field.dbFieldName).notNullable(); break;
                            case 'integer'  : table.integer  (field.dbFieldName).notNullable(); break;
                            case 'datetime' : table.timestamp(field.dbFieldName).notNullable(); break;
                            default: throw new RangeError(`Invalid field type: ${field.type}`);
                        }
                    }
                }
                
                // Always add timestmaps
                client.logger.log(`       -> Adding timestamps`);
                table.timestamps(false, true);
                
                // Add primary key
                client.logger.log(`       -> Adding primary key: ${TableClass.schema.primaryKey}`);
                table.primary(TableClass.schema.primaryKey);
                
                // Add foreign keys
                let fk = 1;
                for (let f = 0; f < TableClass.schema.fields.length; f++) {
                    const field = TableClass.schema.fields[f];
                    
                    let   refTableName;
                    let   refDbFieldName;
                    
                    if (field.refTableName) {
                        refTableName   = field.refTableName;
                        refDbFieldName = 'id';
                    
                    } else if (field.ref) {
                        refTableName   = field.ref.tableName;
                        refDbFieldName = field.ref.dbFieldName;
                    }
                    
                    if (refTableName && refDbFieldName) {
                        const fkName = `${TableClass.schema.tableName}_fk${fk++}`;
                        const fkDescription = `${colorizeField(field.dbFieldName)} `
                                            + `references ${colorizeTable(refTableName)}(${colorizeField(refDbFieldName)}) `
                                            + `as ${colorizeFkName(fkName)}`;
                        client.logger.log(`       -> Adding foreign key: ${fkDescription}`);
                        
                        table.foreign(field.dbFieldName, fkName)
                            .references(refDbFieldName)
                            .inTable(refTableName);
                    }
                }
            }).then(client.logger.log(`  -> Creating table: ${colorizeTable(TableClass.schema.tableName)}`));
        }
    });
};
// Freeze and export
Object.freeze(knex);
module.exports = knex;
