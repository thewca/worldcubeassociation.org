# frozen_string_literal: true

sql = "INSERT INTO `RoundTypes` (`id`, `rank`, `name`, `cellName`, `final`) VALUES
('0', 19, 'Qualification round', 'Qualification round', 0),
('1', 29, 'First round', 'First round', 0),
('2', 50, 'Second round', 'Second round', 0),
('3', 79, 'Semi Final', 'Semi Final', 0),
('b', 39, 'B Final', 'B Final', 0),
('c', 90, 'Final', 'Final', 1),
('d', 20, 'First round', 'First round', 0),
('e', 59, 'Second round', 'Second round', 0),
('f', 99, 'Final', 'Final', 1),
('g', 70, 'Semi Final', 'Semi Final', 0),
('h', 10, 'Qualification round', 'Qualification round', 0);"
ActiveRecord::Base.connection.execute(sql)
