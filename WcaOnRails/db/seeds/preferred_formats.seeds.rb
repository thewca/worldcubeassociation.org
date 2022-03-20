# frozen_string_literal: true

sql = "INSERT INTO preferred_formats
(event_id, format_id, ranking)
VALUES
('333', 'a', 1),
('222', 'a', 1),
('444', 'a', 1),
('555', 'a', 1),
('666', 'm', 1),
('777', 'm', 1),
('333bf', '3', 1),
('333fm', 'm', 1), ('333fm', '2', 2), ('333fm', '1', 3),
('333oh', 'a', 1),
('clock', 'a', 1),
('minx', 'a', 1),
('pyram', 'a', 1),
('skewb', 'a', 1),
('sq1', 'a', 1),
('444bf', '3', 1),
('555bf', '3', 1),
('333mbf', '1', 1), ('333mbf', '2', 2), ('333mbf', '3', 3),
('333ft', 'a', 1), ('333ft', '3', 2), ('333ft', '2', 3), ('333ft', '1', 4),
('magic', 'a', 1),
('mmagic', 'a', 1),
('333mbo', '3', 1), ('333mbo', '2', 2), ('333mbo', '1', 3);"
ActiveRecord::Base.connection.execute(sql)
