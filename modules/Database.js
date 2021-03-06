
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

const dbInit = async () => {
    await knex.schema.hasTable('guardian').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('guardian', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string ('username', 32).notNullable();
                table.string ('timezone', 32);
                table.boolean('private_event_default').notNullable().defaultTo(false);
                table.timestamps(false, true);
            
            }).then(client.logger.log('Created Table: guardian'));
        }
    });
    
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
                
                table.string('name', 32).notNullable();
                table.string('alliance_id', 20).notNullable();
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
                table.primary(['id']);
                
                table.string('guild_id', 20).notNullable();
                table.string('channel_group_id', 20).notNullable();
                table.string('alliance_id', 20).notNullable();
                table.string('webhook_id', 20).notNullable();
                table.string('webhook_url', 256).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('guild_id', 'channel_fk1')
                //    .references('id')
                //    .inTable('guild');
                
                //table.foreign('channel_group_id', 'channel_fk2')
                //    .references('id')
                //    .inTable('channel_group');
                
                //table.foreign('alliance_id', 'channel_fk3')
                //    .references('id')
                //    .inTable('alliance');
                
            }).then(client.logger.log('Created Table: channel'));
        }
    });
    
    await knex.schema.hasTable('message').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('message', function (table) {
                table.string('id', 20).notNullable();
                table.primary(['id']);
                
                table.string ('channel_id', 20).notNullable();
                table.string ('guild_id', 20).notNullable();
                table.string ('orig_message_id', 20);
                table.string ('orig_channel_id', 20);
                table.string ('orig_guild_id', 20);
                table.string ('channel_group_id', 20).notNullable();
                table.string ('alliance_id', 20).notNullable();
                table.boolean('is_clone').notNullable().defaultTo(false);
                table.string ('content', 2000);
                table.string ('author_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('channel_id', 'message_fk1')
                //    .references('id')
                //    .inTable('channel');
                
                //table.foreign('guild_id', 'message_fk2')
                //    .references('id')
                //    .inTable('guild');
                
                //table.foreign('orig_message_id', 'message_fk3')
                //    .references('id')
                //    .inTable('message');
                
                //table.foreign('orig_channel_id', 'message_fk4')
                //    .references('id')
                //    .inTable('channel');
                
                //table.foreign('orig_guild_id', 'message_fk5')
                //    .references('id')
                //    .inTable('guild');
                
                //table.foreign('channel_group_id', 'message_fk6')
                //    .references('id')
                //    .inTable('channel_group');
                
                //table.foreign('alliance_id', 'message_fk7')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('author_id', 'message_fk8')
                //    .references('id')
                //    .inTable('guardian');
            
            }).then(client.logger.log('Created Table: message'));
        }
    });
    
    // **************************** //
    // * Looking for Group Tables * //
    // **************************** //
    
    await knex.schema.hasTable('activity_category').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('activity_category', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string('name', 32).notNullable();
                table.string('symbol', 1).notNullable();
                table.string('alliance_id', 20);
                table.string('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('alliance_id', 'activity_category_fk1')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('creator_id', 'activity_category_fk2')
                //    .references('id')
                //    .inTable('guardian');
                
            }).then(client.logger.log('Created Table: activity_category'));
        }
    });
    
    await knex.schema.hasTable('activity').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('activity', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string ('name', 32).notNullable();
                table.string ('activity_category_id', 20).notNullable();
                table.integer('fireteam_size').notNullable();
                table.integer('est_max_duration').notNullable();
                table.string ('alliance_id', 20);
                table.string ('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('activity_category_id', 'activity_fk1')
                //    .references('id')
                //    .inTable('activity_category');
                
                //table.foreign('alliance_id', 'activity_fk2')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('creator_id', 'activity_fk3')
                //    .references('id')
                //    .inTable('guardian');
                
            }).then(client.logger.log('Created Table: activity'));
        }
    });
    
    await knex.schema.hasTable('activity_alias').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('activity_alias', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string ('alias', 16).notNullable();
                table.string ('activity_id', 20).notNullable();
                table.string ('alliance_id', 20);
                table.string ('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('activity_id', 'activity_alias_fk1')
                //    .references('id')
                //    .inTable('activity');
                
                //table.foreign('alliance_id', 'activity_alias_fk2')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('creator_id', 'activity_alias_fk3')
                //    .references('id')
                //    .inTable('guardian');
                
            }).then(client.logger.log('Created Table: activity_alias'));
        }
    });
    
    await knex.schema.hasTable('event').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('event', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string   ('activity_id', 20).notNullable();
                table.string   ('activity_category_id', 20).notNullable();
                table.string   ('alliance_id', 20);
                table.string   ('guild_id', 20).notNullable();
                table.string   ('channel_name', 32).notNullable();
                table.string   ('platform', 16).notNullable();
                table.string   ('description', 256);
                table.timestamp('start_time').notNullable();
                table.integer  ('fireteam_size').notNullable();
                table.integer  ('est_max_duration').notNullable();
                table.boolean  ('is_private').notNullable();
                table.boolean  ('auto_delete').notNullable();
                table.string   ('creator_id', 20).notNullable();
                table.string   ('owner_id', 20).notNullable();
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('activity_id', 'event_fk1')
                //    .references('id')
                //    .inTable('activity');
                
                //table.foreign('category_id', 'event_fk2')
                //    .references('id')
                //    .inTable('event_category');
                
                //table.foreign('alliance_id', 'event_fk3')
                //    .references('id')
                //    .inTable('alliance');
                
                //table.foreign('guild_id', 'event_fk4')
                //    .references('id')
                //    .inTable('guild');
                
                //table.foreign('creator_id', 'event_fk5')
                //    .references('id')
                //    .inTable('guardian');
                
                //table.foreign('owner_id', 'event_fk6')
                //    .references('id')
                //    .inTable('guardian');
    
            }).then(client.logger.log('Created Table: event'));
        }
    });
    
    await knex.schema.hasTable('event_channel').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('event_channel', function (table) {
                table.string('channel_id', 20).notNullable();
                table.primary('channel_id');
                
                table.string('event_id', 20).notNullable();
                table.string('guild_id', 20).notNullable();
                table.string('guild_name', 100);
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('channel_id', 'event_channel_fk1')
                //    .references('id')
                //    .inTable('channel');
                
                //table.foreign('event_id', 'event_channel_fk2')
                //    .references('id')
                //    .inTable('event');
                
                //table.foreign('guild_id', 'event_channel_fk3')
                //    .references('id')
                //    .inTable('guild');
                
            }).then(client.logger.log('Created Table: event_channel'));
        }
    });
    
    await knex.schema.hasTable('participant').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('participant', function (table) {
                table.string('guardian_id', 20).notNullable();
                table.string('event_id', 20).notNullable();
                table.primary(['guardian_id', 'event_id']);
                
                table.string('joined_from_channel_id', 20).notNullable();
                table.string('joined_from_guild_id', 20).notNullable();
                table.boolean('is_primary', 20).notNullable().defaultTo(true);
                table.timestamps(false, true);
                
                //
                // Foreign Keys
                //
                
                //table.foreign('event_id', 'activity_member_fk1')
                //    .references('id')
                //    .inTable('event');
                
                //table.foreign('guardian_id', 'activity_member_fk2')
                //    .references('id')
                //    .inTable('guardian');
                
                //table.foreign('channel_id', 'activity_member_fk3')
                //    .references('id')
                //    .inTable('channel');
                
                //table.foreign('guild_id', 'activity_member_fk4')
                //    .references('id')
                //    .inTable('guild');
                
            }).then(client.logger.log('Created Table: participant'));
        }
    });
    
    await knex.schema.hasTable('event_channel_group').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('event_channel_group', function (table) {
                table.string('id', 20).notNullable();
                table.primary('id');
                
                table.string('name', 32).notNullable();
                table.string('alliance_id', 20).notNullable();
                table.boolean('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
            }).then(client.logger.log('Created Table: event_channel_group'));
        }
    });
    
    await knex.schema.hasTable('command_channel').then(function(exists) {
        if (!exists) {
            knex.schema.createTable('command_channel', function (table) {
                table.string('channel_id', 20).notNullable();
                table.primary('channel_id');
                
                table.string('type', 16).notNullable();
                table.string('event_channel_group_id', 20);
                table.string('alliance_id', 20).notNullable();
                table.string('creator_id', 20).notNullable();
                table.timestamps(false, true);
                
            }).then(client.logger.log('Created Table: command_channel'));
        }
    });
};

dbInit();

// Freeze and export
Object.freeze(knex);
module.exports = knex;
