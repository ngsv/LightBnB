const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb',
  port: 5432
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE email = $1`, [email])
    .then(res => {
      if (res.rows !== []) {
        return res.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => console.log(err.message));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`
      SELECT * FROM users
      WHERE id = $1`, [id])
    .then(res => {
      if (res.rows !== []) {
        return res.rows[0];
      } else {
        return null;
      }
    })
    .catch(err => console.log(err.message));
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
      `, [user.name, user.email, user.password])
    .then(res => {
      return res.rows[0];
    })
    .catch(err => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
      SELECT reservations.*, properties.*, AVG(rating) AS average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON property_reviews.property_id = properties.id
      WHERE reservations.guest_id = $1 AND reservations.start_date >= NOW()::DATE
      GROUP BY reservations.id, properties.id
      ORDER BY reservations.start_date
      LIMIT $2`, [guest_id, limit])
    .then(res => {
      return res.rows;
    })
    .catch(err => console.log(err.message));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const queryParams = [];
  let queryParamsLength = 0;

  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  if (options.city) {
    queryParamsLength++;
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParamsLength} `;
  }

  if (options.owner_id) {
    queryParamsLength++;
    queryParams.push(options.owner_id);
    if (queryParamsLength === 0) {
      queryString += `WHERE owner_id = $${queryParamsLength} `;
    } else {
      queryString += `AND owner_id = $${queryParamsLength} `;
    }

  }

  if (options.minimum_price_per_night) {
    queryParamsLength++;
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryParamsLength === 0) {
      queryString += `WHERE cost_per_night >= $${queryParamsLength} `;
    } else {
      queryString += `AND cost_per_night >= $${queryParamsLength} `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParamsLength++;
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryParamsLength === 0) {
      queryString += `WHERE cost_per_night <= $${queryParamsLength} `;
    } else {
      queryString += `AND cost_per_night <= $${queryParamsLength} `;
    }
  }

  queryString += `
  GROUP BY properties.id`;

  if (options.minimum_rating) {
    queryParamsLength++;
    queryParams.push(options.minimum_rating);
    queryString += `
  HAVING AVG(property_reviews.rating) >= $${queryParamsLength} `;
  }

  queryParamsLength++;
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParamsLength};
  `;

  console.log(queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then(result => {
      return result.rows;
    })
    .catch(err => console.log(err.message));
};
exports.getAllProperties = getAllProperties;

// SELECT properties.id, title, cost_per_night, start_date, AVG(property_reviews.rating) AS average_rating
// FROM reservations
// JOIN properties ON reservations.property_id = properties.id
// JOIN property_reviews ON property_reviews.property_id = properties.id
// WHERE reservations.guest_id = 1 AND reservations.end_date < NOW()::DATE
// GROUP BY properties.id, reservations.id
// ORDER BY reservations.start_date
// LIMIT 10;



/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
