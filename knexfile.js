module.exports = {
  development: {
    // client: "sqlite3",
    // connection: {
    //   filename: "./geeklist-api-dev.sqlite"
    // },
    client: "pg",
    connection: {
      host: "localhost",
      database: "geeklist-api-dev"
    },
    pool: {
      min: 2,
      max: 2
    },
    useNullAsDefault: true
  },

  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    },
    useNullAsDefault: true
  }
};
