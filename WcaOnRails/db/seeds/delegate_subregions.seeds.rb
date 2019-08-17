# frozen_string_literal: true

sql = "INSERT INTO `delegate_subregions` (`name`, `delegate_region_id`) VALUES
('Canada', 11),
('California, USA', 11),
('Mid-Atlantic, USA', 11),
('Midwest, USA', 11),
('New England, USA', 11),
('Pacific Northwest, USA', 11),
('Rockies, USA', 11),
('South, USA', 11),
('Southeast, USA', 11),
('Brazil', 9),
('Central America', 9),
('South America (Central)', 9),
('South America (North)', 9),
('South America (South)', 9);"
ActiveRecord::Base.connection.execute(sql)
