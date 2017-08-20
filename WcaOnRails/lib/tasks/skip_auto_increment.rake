# frozen_string_literal: true

# Copied from https://stackoverflow.com/a/20695238
Rake::Task["db:structure:dump"].enhance do
  path = Rails.root.join('db', 'structure.sql')
  File.write path, File.read(path).gsub(/ AUTO_INCREMENT=\d*/, '')
end
