# frozen_string_literal: true

# Copied from https://github.com/rails/rails/issues/9855#issuecomment-28874587
require 'active_record/connection_adapters/abstract_mysql_adapter'

class ActiveRecord::ConnectionAdapters::AbstractMysqlAdapter
  NATIVE_DATABASE_TYPES[:string] = { name: "varchar", limit: 191 }
end
