# frozen_string_literal: true

sql = "INSERT INTO `events` (`id`, `name`, `rank`, `format`, `cell_name`) VALUES
('333', '3x3x3 Cube', 10, 'time', '3x3x3 Cube'),
('222', '2x2x2 Cube', 20, 'time', '2x2x2 Cube'),
('444', '4x4x4 Cube', 30, 'time', '4x4x4 Cube'),
('555', '5x5x5 Cube', 40, 'time', '5x5x5 Cube'),
('666', '6x6x6 Cube', 50, 'time', '6x6x6 Cube'),
('777', '7x7x7 Cube', 60, 'time', '7x7x7 Cube'),
('333bf', '3x3x3 Blindfolded', 70, 'time', '3x3x3 Blindfolded'),
('333fm', '3x3x3 Fewest Moves', 80, 'number', '3x3x3 Fewest Moves'),
('333oh', '3x3x3 One-Handed', 90, 'time', '3x3x3 One-Handed'),
('clock', 'Clock', 110, 'time', 'Clock'),
('minx', 'Megaminx', 120, 'time', 'Megaminx'),
('pyram', 'Pyraminx', 130, 'time', 'Pyraminx'),
('skewb', 'Skewb', 140, 'time', 'Skewb'),
('sq1', 'Square-1', 150, 'time', 'Square-1'),
('444bf', '4x4x4 Blindfolded', 160, 'time', '4x4x4 Blindfolded'),
('555bf', '5x5x5 Blindfolded', 170, 'time', '5x5x5 Blindfolded'),
('333mbf', '3x3x3 Multi-Blind', 180, 'multi', '3x3x3 Multi-Blind'),
('333ft', '3x3x3 With Feet', 996, 'time', '3x3x3 With Feet'),
('magic', 'Magic', 997, 'time', 'Magic'),
('mmagic', 'Master Magic', 998, 'time', 'Master Magic'),
('333mbo', '3x3x3 Multi-Blind Old Style', 999, 'multi', '3x3x3 Multi-Blind Old Style');"

ActiveRecord::Base.connection.execute(sql)
