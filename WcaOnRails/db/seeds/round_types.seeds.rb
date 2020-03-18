# frozen_string_literal: true

sql = "INSERT INTO `RoundTypes` (`id`, `rank`, `name`, `cellName`, `final`) VALUES
('0', 19, 'Qualification round', 'Qualification', 0),
('1', 29, 'First round', 'First', 0),
('2', 50, 'Second round', 'Second', 0),
('3', 79, 'Semi Final', 'Semi Final', 0),
('b', 39, 'B Final', 'B Final', 0),
('c', 90, 'Cutoff Final', 'Cutoff Final', 1),
('d', 20, 'Cutoff First round', 'Cutoff First', 0),
('e', 59, 'Cutoff Second round', 'Cutoff Second', 0),
('f', 99, 'Final', 'Final', 1),
('g', 70, 'Cutoff Third round', 'Cutoff Third', 0),
('h', 10, 'Combined qualification', 'Combined qualification', 0);"
ActiveRecord::Base.connection.execute(sql)
