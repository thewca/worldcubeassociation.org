# frozen_string_literal: true

# Copied (and modified) from https://stackoverflow.com/a/20695238

def normalize_schema_dump(schema_dump)
  schema_dump.gsub(/ AUTO_INCREMENT=\d*/, '')
             .rstrip + "\n" # remove extra newlines at the end
end

Rake::Task["db:structure:dump"].enhance do
  path = Rails.root.join('db', 'structure.sql')
  File.write path, normalize_schema_dump(File.read(path))
end
