
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Load the database client
const knex = require('knex')(client.config.database);

console.log('Connected to database');

// ******************* //
// * Alliance Tables * //
// ******************* //

knex.ninkasiDatabaseInit = async () => {
    // Load our tables
    const Tables = [
        require(`${ROOT}/modules/data/Guardian`),
      //require(`${ROOT}/modules/data/Guild`),
      //require(`${ROOT}/modules/data/Alliance`),
      //require(`${ROOT}/modules/data/AllianceParameter`),
      //require(`${ROOT}/modules/data/ChannelGroup`),
      //require(`${ROOT}/modules/data/Channel`),
//        require(`${ROOT}/modules/data/Message`),
//        require(`${ROOT}/modules/data/ActivityCategory`),
//        require(`${ROOT}/modules/data/Activity`),
//        require(`${ROOT}/modules/data/ActivityAlias`),
//        require(`${ROOT}/modules/data/Event`),
//        require(`${ROOT}/modules/data/Participant`),
//        require(`${ROOT}/modules/data/UserFriendlyId`)
    ];
    
    for (let t = 0; t < Tables.length; t++) {
        await knex.createNinkasiTable(Tables[t]);
    }

    //await knex.schema.hasTable('guardian').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('guardian', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.string ('username', 32).notNullable();
    //            table.string ('timezone', 32);
    //            table.boolean('private_event_default').notNullable();
    //            table.timestamps(false, true);
    //        
    //        }).then(client.logger.log('Created Table: guardian'));
    //    }
    //});
    
    await knex.schema.hasTable('guild').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('guild', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string ('alliance_id', 20);
                table.string ('clan_name', 25);
                table.string ('clan_short_name', 4);
                table.integer('clan_bungie_num');
                table.string ('timezone', 32);
                table.timestamps();
                
                //
                // Foreign Keys
                //
                
                //table.foreign('alliance_id', 'guild_fk1')
                //    .references('id')
                //    .inTable('alliance');
                
            }).then(client.logger.log('Created Table: guild'));
        }
    });
    
    await knex.schema.hasTable('alliance').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('alliance', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string('name', 32).notNullable();
                table.string('short_name', 4).notNullable();
                table.string('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('creator_id', 'alliance_fk1')
                //    .references('id')
                //    .inTable('guardian');
                
            }).then(client.logger.log('Created Table: alliance'));
        }
    });
    
    await knex.schema.hasTable('alliance_parameter').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('alliance_parameter', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string('alliance_id', 20).notNullable();
                table.string('name', 32).notNullable();
                table.string('value', 4096);
                table.string('creator_id', 20).notNullable();
                table.string('updater_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('alliance_id', 'alliance_parameter_fk1')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('creator_id', 'alliance_parameter_fk2')
                //    .references('id')
                //    .inTable('guardian');
                
                //table.foreign('updater_id', 'alliance_parameter_fk3')
                //    .references('id')
                //    .inTable('guardian');
            
            }).then(client.logger.log('Created Table: alliance_parameter'));
        }
    });
    
    // ********************************** //
    // * Channel Synchronization Tables * //
    // ********************************** //
    
    await knex.schema.hasTable('channel_group').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('channel_group', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string('type', 16).notNullable();
                table.string('name', 32).notNullable();
                table.string('alliance_id', 20).notNullable();
                table.string('event_id', 20);
                table.string('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
                //table.foreign('alliance_id', 'channel_group_fk1')
                //    .references('id')
                //    .inTable('alliance');
                
            }).then(client.logger.log('Created Table: channel_group'));
        }
    });
    
    await knex.schema.hasTable('channel').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('channel', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string ('type', 20).notNullable();
                table.string ('alliance_id', 20).notNullable();
                table.string ('guild_id', 20).notNullable();
                table.string ('channel_group_id', 20);
                table.string ('event_id', 20);
                table.boolean('is_event_channel').notNullable();
                table.boolean('is_sync_channel').notNullable();
                table.string ('command_channel_type', 16);
                table.string ('webhook_id', 20);
                table.string ('webhook_url', 256);
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('guild_id', 'channel_fk1')
                //    .references('id')
                //    .inTable('guild');
                
                //table.foreign('alliance_id', 'channel_fk2')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('channel_group_id', 'channel_fk3')
                //    .references('id')
                //    .inTable('channel_group');
                
                //table.foreign('event_id', 'channel_fk4')
                //    .references('id')
                //    .inTable('event');
                
            }).then(client.logger.log('Created Table: channel'));
        }
    });
    
    //await knex.schema.hasTable('message').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('message', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.string ('alliance_id', 20).notNullable();
    //            table.string ('channel_id', 20).notNullable();
    //            table.string ('guild_id', 20).notNullable();
    //            table.string ('channel_group_id', 20);
    //            table.string ('event_id', 20);
    //            table.string ('orig_channel_id', 20);
    //            table.string ('orig_guild_id', 20);
    //            table.string ('orig_message_id', 20);
    //            table.boolean('is_sync_message').notNullable();
    //            table.boolean('is_clone_message').notNullable();
    //            table.boolean('is_reaction_message').notNullable();
    //            table.string ('reaction_message_type', 16);
    //            table.string ('content', 2000);
    //            table.string ('author_id', 20).notNullable();
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('alliance_id', 'message_fk1')
    //            //    .references('id')
    //            //    .inTable('alliance');
    //            
    //            //table.foreign('channel_id', 'message_fk2')
    //            //    .references('id')
    //            //    .inTable('channel');
    //            
    //            //table.foreign('guild_id', 'message_fk3')
    //            //    .references('id')
    //            //    .inTable('guild');
    //            
    //            //table.foreign('channel_group_id', 'message_fk4')
    //            //    .references('id')
    //            //    .inTable('channel_group');
    //            
    //            //table.foreign('event_id', 'message_fk5')
    //            //    .references('id')
    //            //    .inTable('event');
    //            
    //            //table.foreign('orig_channel_id', 'message_fk6')
    //            //    .references('id')
    //            //    .inTable('channel');
    //            
    //            //table.foreign('orig_guild_id', 'message_fk7')
    //            //    .references('id')
    //            //    .inTable('guild');
    //            
    //            //table.foreign('orig_message_id', 'message_fk8')
    //            //    .references('id')
    //            //    .inTable('message');
    //            
    //            //table.foreign('author_id', 'message_fk9')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //        
    //        }).then(client.logger.log('Created Table: message'));
    //    }
    //});
    
    // **************************** //
    // * Looking for Group Tables * //
    // **************************** //
    
    //await knex.schema.hasTable('activity_category').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('activity_category', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.string('name', 32).notNullable();
    //            table.string('symbol', 1).notNullable();
    //            table.string('alliance_id', 20);
    //            table.string('creator_id', 20).notNullable();
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('alliance_id', 'activity_category_fk1')
    //            //    .references('id')
    //            //    .inTable('alliance');
    //            
    //            //table.foreign('creator_id', 'activity_category_fk2')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //            
    //        }).then(client.logger.log('Created Table: activity_category'));
    //    }
    //});
    
    //await knex.schema.hasTable('activity').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('activity', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.string ('name', 32).notNullable();
    //            table.string ('short_name', 16).notNullable();
    //            table.string ('activity_category_id', 20).notNullable();
    //            table.string ('alliance_id', 20);
    //            table.integer('est_max_duration').notNullable();
    //            table.integer('fireteam_size').notNullable();
    //            table.string ('creator_id', 20).notNullable();
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('activity_category_id', 'activity_fk1')
    //            //    .references('id')
    //            //    .inTable('activity_category');
    //            
    //            //table.foreign('alliance_id', 'activity_fk2')
    //            //    .references('id')
    //            //    .inTable('alliance');
    //            
    //            //table.foreign('creator_id', 'activity_fk3')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //            
    //        }).then(client.logger.log('Created Table: activity'));
    //    }
    //});
    
    //await knex.schema.hasTable('activity_alias').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('activity_alias', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.string ('alias', 16).notNullable();
    //            table.string ('activity_id', 20).notNullable();
    //            table.string ('alliance_id', 20);
    //            table.string ('creator_id', 20).notNullable();
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('activity_id', 'activity_alias_fk1')
    //            //    .references('id')
    //            //    .inTable('activity');
    //            
    //            //table.foreign('alliance_id', 'activity_alias_fk2')
    //            //    .references('id')
    //            //    .inTable('alliance');
    //            
    //            //table.foreign('creator_id', 'activity_alias_fk3')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //            
    //        }).then(client.logger.log('Created Table: activity_alias'));
    //    }
    //});
    
    //await knex.schema.hasTable('event').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('event', function (table) {
    //            table.string('id', 20).notNullable();
    //            table.primary('id');
    //            
    //            table.integer  ('ufid').notNullable();
    //            table.string   ('activity_id', 20).notNullable();
    //            table.string   ('activity_category_id', 20).notNullable();
    //            table.string   ('guild_id', 20).notNullable();
    //            table.string   ('alliance_id', 20);
    //            table.string   ('channel_name', 32).notNullable();
    //            table.string   ('description', 256);
    //            table.string   ('status', 16).notNullable();
    //            table.string   ('platform', 16).notNullable();
    //            table.timestamp('start_time').notNullable();
    //            table.integer  ('est_max_duration').notNullable();
    //            table.integer  ('fireteam_size').notNullable();
    //            table.boolean  ('is_private').notNullable();
    //            table.boolean  ('auto_delete').notNullable();
    //            table.string   ('creator_id', 20).notNullable();
    //            table.string   ('owner_id', 20).notNullable();
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('activity_id', 'event_fk1')
    //            //    .references('id')
    //            //    .inTable('activity');
    //            
    //            //table.foreign('activity_category_id', 'event_fk2')
    //            //    .references('id')
    //            //    .inTable('activity_category');
    //            
    //            //table.foreign('guild_id', 'event_fk3')
    //            //    .references('id')
    //            //    .inTable('guild');
    //            
    //            //table.foreign('alliance_id', 'event_fk4')
    //            //    .references('id')
    //            //    .inTable('alliance');
    //            
    //            //table.foreign('creator_id', 'event_fk5')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //            
    //            //table.foreign('owner_id', 'event_fk6')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //
    //        }).then(client.logger.log('Created Table: event'));
    //    }
    //});
    
    //await knex.schema.hasTable('participant').then(function(exists) {
    //    if (!exists) {
    //        knex.schema.createTable('participant', function (table) {
    //            table.string('guardian_id', 20).notNullable();
    //            table.string('event_id', 20).notNullable();
    //            table.primary(['guardian_id', 'event_id']);
    //            
    //            table.string('joined_from_channel_id', 20).notNullable();
    //            table.string('joined_from_guild_id', 20).notNullable();
    //            table.boolean('is_primary', 20).notNullable().defaultTo(true);
    //            table.timestamps(false, true);
    //            
    //            //
    //            // Foreign Keys
    //            //
    //            
    //            //table.foreign('event_id', 'activity_member_fk1')
    //            //    .references('id')
    //            //    .inTable('event');
    //            
    //            //table.foreign('guardian_id', 'activity_member_fk2')
    //            //    .references('id')
    //            //    .inTable('guardian');
    //            
    //            //table.foreign('joined_from_channel_id', 'activity_member_fk3')
    //            //    .references('id')
    //            //    .inTable('channel');
    //            
    //            //table.foreign('joined_from_guild_id', 'activity_member_fk4')
    //            //    .references('id')
    //            //    .inTable('guild');
    //            
    //        }).then(client.logger.log('Created Table: participant'));
    //    }
    //});
    
    // await knex.schema.hasTable('user_friendly_id').then(function(exists) {
    //     if (!exists) {
    //         knex.schema.createTable('user_friendly_id', function (table) {
    //             table.string('id', 20).notNullable();
    //             table.primary('id');
                
    //             table.string ('type', 16).notNullable();
    //             table.string ('ufid', 8).notNullable();
    //             table.string ('object_id', 20);
    //             table.string ('prefix', 1);
    //             table.integer('digits').notNullable();
    //             table.string ('status', 16).notNullable();
    //             table.boolean('is_active').notNullable();
    //             table.string ('created_id', 20).notNullable();
    //             table.timestamps(false, true);
    //         }).then(client.logger.log('Created Table: user_friendly_id'));
    //     }
    // });
    
    // Load our tables
    const moreTables = [
//        require(`${ROOT}/modules/data/Guardian`),
      //require(`${ROOT}/modules/data/Guild`),
      //require(`${ROOT}/modules/data/Alliance`),
      //require(`${ROOT}/modules/data/AllianceParameter`),
      //require(`${ROOT}/modules/data/ChannelGroup`),
      //require(`${ROOT}/modules/data/Channel`),
        require(`${ROOT}/modules/data/ActivityCategory`),
        require(`${ROOT}/modules/data/Activity`),
        require(`${ROOT}/modules/data/ActivityAlias`),
        require(`${ROOT}/modules/data/Event`),
        require(`${ROOT}/modules/data/Message`),
        require(`${ROOT}/modules/data/Participant`),
        require(`${ROOT}/modules/data/UserFriendlyId`)
    ];
    
    for (let t = 0; t < moreTables.length; t++) {
        await knex.createNinkasiTable(moreTables[t]);
    }
};

knex.createNinkasiTable = async (TableClass) => {
    //const knex = require(`${ROOT}/modules/Database`);
    //const TableClass = this;
    
    await knex.schema.hasTable(TableClass.schema.tableName).then(async function(exists) {
        if (!exists) {
            await knex.schema.createTable(TableClass.schema.tableName, async function (table) {
                
                for (let f = 0; f < TableClass.schema.fields.length; f++) {
                    const field = TableClass.schema.fields[f];
                    
                    if (field.dbFieldName == 'created_at' || field.dbFieldName == 'updated_at') {
                        continue;
                    }
                    
                    if (field.nullable) {
                        switch (field.type) {
                            case 'snowflake':table.string   (field.dbFieldName, 20); break;
                            case 'string'   :table.string   (field.dbFieldName, field.length); break;
                            case 'boolean'  :table.boolean  (field.dbFieldName); break;
                            case 'integer'  :table.integer  (field.dbFieldName); break;
                            case 'datetime' :table.timestamp(field.dbFieldName); break;
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
                table.timestamps(false, true);
                
                // Add primary key
                table.primary(TableClass.schema.primaryKey);
                
                // Add foreign keys
                let fk = 1;
                for (let f = 0; f < TableClass.schema.fields.length; f++) {
                    const field = TableClass.schema.fields[f];
                    
                    let refTableName;
                    let refDbFieldName;
                    
                    if (field.refTableName) {
                        refTableName   = field.refTableName;
                        refDbFieldName = 'id';
                    
                    } else if (field.ref) {
                        refTableName   = field.ref.tableName;
                        refDbFieldName = field.ref.dbFieldName;
                    }
                    
                    if (refTableName && refDbFieldName) {
                        table.foreign(field.dbFieldName, `${TableClass.schema.tableName}_fk${fk++}`)
                            .references(refDbFieldName)
                            .inTable(refTableName);
                    }
                }
                
                // Add the secondary keys
                // TODO - Add creation of secondary keys
            
            }).then(client.logger.log(`Created Table: ${TableClass.schema.tableName}`));
        }
    });
};
// Freeze and export
Object.freeze(knex);
module.exports = knex;
