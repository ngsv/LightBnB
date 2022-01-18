SELECT properties.id, title, cost_per_night, start_date, AVG(property_reviews.rating) AS average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE reservations.guest_id = 1 AND reservations.end_date < NOW()::DATE
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10;
