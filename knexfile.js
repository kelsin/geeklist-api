module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: "./devDb.sqlite"
    },
    useNullAsDefault: true
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  }
};
