SELECT competition_id, start_date, end_date FROM competitions WHERE announced_at is not NULL AND RIGHT(competition_id,4) <> YEAR(start_date) AND RIGHT(competition_id,4) <> YEAR(end_date)
