# frozen_string_literal: true

sql = "INSERT INTO `continents` (`id`, `name`, `record_name`, `latitude`, `longitude`, `zoom`) VALUES
('_Multiple Continents', 'Multiple Continents', '', 0, 0, 1),
('_Africa', 'Africa', 'AfR', 213671, 16984850, 3),
('_Asia', 'Asia', 'AsR', 34364439, 108330700, 2),
('_Europe', 'Europe', 'ER', 58299984, 23049300, 3),
('_North America', 'North America', 'NAR', 45486546, -93449700, 3),
('_Oceania', 'Oceania', 'OcR', -25274398, 133775136, 3),
('_South America', 'South America', 'SAR', -21735104, -63281250, 3);"
ActiveRecord::Base.connection.execute(sql)
