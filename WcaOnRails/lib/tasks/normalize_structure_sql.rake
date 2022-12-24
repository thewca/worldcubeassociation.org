# frozen_string_literal: true

# Copied (and modified) from https://stackoverflow.com/a/20695238

def normalize_schema_dump(schema_dump)
  schema_dump = schema_dump.gsub(/ AUTO_INCREMENT=\d*/, '').rstrip + "\n" # remove extra newlines at the end
  schema_dump = schema_dump.gsub(/ *$/, '') # remove trailing whitespace
  schema_dump.gsub(%r{\n.* DEFINER=[^*]* \*/$}, '') # remove DEFINER= declarations
end

Rake::Task["db:schema:dump"].enhance do
  path = Rails.root.join('db', 'structure.sql')
  File.write path, normalize_schema_dump(File.read(path))
end
