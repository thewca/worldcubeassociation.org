# frozen_string_literal: true
sql = "INSERT INTO `Rounds` (`id`, `rank`, `name`, `cellName`) VALUES
('0', 19, 'Qualification round', 'Qualification'),
('1', 29, 'First round', 'First'),
('2', 50, 'Second round', 'Second'),
('3', 79, 'Semi Final', 'Semi Final'),
('b', 39, 'B Final', 'B Final'),
('c', 90, 'Combined Final', 'Combined Final'),
('d', 20, 'Combined First round', 'Combined First'),
('e', 59, 'Combined Second round', 'Combined Second'),
('f', 99, 'Final', 'Final'),
('g', 70, 'Combined Third round', 'Combined Third'),
('h', 10, 'Combined qualification', 'Combined qualification');"
connection = ActiveRecord::Base.connection()
connection.execute(sql)
