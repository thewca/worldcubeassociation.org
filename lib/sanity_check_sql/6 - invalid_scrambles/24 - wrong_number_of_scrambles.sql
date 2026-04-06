SELECT c.start_date,
       s.competition_id,
       s.event_id,
       s.round_type_id,
       r.format_id,
       f.expected_solve_count,
       s.min_scramble_num,
       s.max_scramble_num,
       s.group_scramble_nums
FROM (SELECT distinct competition_id, round_type_id, format_id, event_id FROM results) AS r
       INNER JOIN (SELECT competition_id,
                          event_id,
                          round_type_id,
                          MIN(scramble_num)  min_scramble_num,
                          MAX(scramble_num)  max_scramble_num,
                          GROUP_CONCAT(CONCAT('(', group_id, ', ', scramble_num, ')') SEPARATOR
                                       ', ') group_scramble_nums
                   FROM (SELECT competition_id, event_id, round_type_id, group_id, count(*) as scramble_num
                         FROM scrambles
                         WHERE is_extra = 0
                         GROUP BY competition_id, event_id, round_type_id, group_id) t
                   GROUP BY competition_id, event_id, round_type_id) AS s
                  ON s.competition_id = r.competition_id AND s.round_type_id = r.round_type_id AND
                     s.event_id = r.event_id
       INNER JOIN formats as f ON r.format_id = f.id
       INNER JOIN competitions as c ON s.competition_id = c.id
WHERE ((min_scramble_num <> f.expected_solve_count OR max_scramble_num <> f.expected_solve_count) AND
       s.event_id <> '333mbf')
   OR (max_scramble_num <> f.expected_solve_count AND s.event_id = '333mbf')
ORDER BY start_date
