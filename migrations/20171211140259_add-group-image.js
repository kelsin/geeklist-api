
exports.up = function(knex, Promise) {
    return knex.schema.table('groups', function(t) {
        t.integer('imageid');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('groups', function(t) {
        t.dropColumn('imageid');
    });
};
