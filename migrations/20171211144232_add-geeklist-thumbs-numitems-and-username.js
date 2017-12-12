exports.up = function(knex, Promise) {
    return knex.schema.table('geeklists', function(t) {
        t.integer('thumbs');
        t.integer('numitems');
        t.string('username');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('geeklists', function(t) {
        t.dropColumn('thumbs');
        t.dropColumn('numitems');
        t.dropColumn('username');
    });
};
