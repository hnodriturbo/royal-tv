UPDATE "Subscription"
SET
    status = 'expired'
WHERE
    status = 'active'
    AND endDate < NOW();

UPDATE "FreeTrial"
SET
    status = 'disabled'
WHERE
    status = 'active'
    AND endDate < NOW();