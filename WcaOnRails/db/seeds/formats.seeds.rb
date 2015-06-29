sql = "INSERT INTO `Formats` (`id`, `name`) VALUES
('1', 'Best of 1'),
('2', 'Best of 2'),
('3', 'Best of 3'),
('a', 'Average of 5'),
('m', 'Mean of 3');"
connection = ActiveRecord::Base.connection()
connection.execute(sql)
