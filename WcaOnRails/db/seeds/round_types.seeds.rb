# frozen_string_literal: true

sql = "INSERT INTO `RoundTypes` (`id`, `rank`, `name`, `cellName`, `final`) VALUES
('0', 19, 'Qualification round', 'Qualification', 0),
('1', 29, 'First round', 'First', 0),
('2', 50, 'Second round', 'Second', 0),
('3', 79, 'Semi Final', 'Semi Final', 0),
('b', 39, 'B Final', 'B Final', 0),
('c', 90, 'Combined Final', 'Combined Final', 1),
('d', 20, 'Combined First round', 'Combined First', 0),
('e', 59, 'Combined Second round', 'Combined Second', 0),
('f', 99, 'Final', 'Final', 1),
('g', 70, 'Combined Third round', 'Combined Third', 0),
('h', 10, 'Combined qualification', 'Combined qualification', 0);"
ActiveRecord::Base.connection.execute(sql)
