# frozen_string_literal: true

# Copied from https://github.com/rails/rails/issues/9855#issuecomment-28874587
require 'active_record/connection_adapters/abstract_mysql_adapter'

module ActiveRecord
  module ConnectionAdapters
    class AbstractMysqlAdapter
      NATIVE_DATABASE_TYPES[:string] = { name: 'varchar', limit: 191 }
    end
  end
end
