# frozen_string_literal: true

sql = "INSERT INTO formats
(id, name, sort_by, sort_by_second, expected_solve_count,
trim_fastest_n, trim_slowest_n)
VALUES
('1', 'Best of 1', 'single', 'average', 1, 0, 0),
('2', 'Best of 2', 'single', 'average', 2, 0, 0),
('3', 'Best of 3', 'single', 'average', 3, 0, 0),
('a', 'Average of 5', 'average', 'single', 5, 1, 1),
('m', 'Mean of 3', 'average', 'single', 3, 0, 0);"
ActiveRecord::Base.connection.execute(sql)
