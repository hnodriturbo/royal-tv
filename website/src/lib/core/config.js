import dotenv from 'dotenv';
dotenv.config();
// Example usage of the environment variables
const dbUser = process.env.DB_USER;
const dbPassword = String(process.env.DB_PASS);
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const node_environment = process.env.NODE_ENV;

// config.js
export const dbConfig = {
  user: dbUser, // Default to 'postgres'
  host: dbHost, // Default to 'localhost'
  database: dbName, // Replace with your database name
  password: dbPassword,
  port: dbPort, // Default PostgreSQL port
  ssl:
    node_environment === 'production'
      ? { rejectUnauthorized: false } // No need for SSL in production
      : false // Disable SSL in development
};
