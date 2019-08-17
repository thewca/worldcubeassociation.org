# frozen_string_literal: true

sql = "INSERT INTO `delegate_regions` (`name`, `isActive`) VALUES
('Africa', 1),
('Asia East', 1),
('Asia Japan', 1),
('Asia Southeast', 1),
('Asia West & India', 1),
('Europe East & Middle East', 1),
('Europe North & Baltic States', 1),
('Europe West', 1),
('Latin America', 1),
('Oceania', 1),
('USA & Canada', 1),
('USA East & Canada', 0),
('USA West', 0);"
ActiveRecord::Base.connection.execute(sql)
