SELECT id FROM competitions WHERE results_posted_by IS NULL AND announced_at IS NOT NULL AND id IN (SELECT competition_id FROM results)
