module ActiveRecord
  module ConnectionAdapters
    class AbstractAdapter
      class SchemaCreation # :nodoc:
        private
          def visit_ColumnDefinition(o)
            sql_type = type_to_sql(o.type, o.limit, o.precision, o.scale)
            column_sql = "#{quote_column_name(o.name)} #{sql_type}"
            add_column_options!(column_sql, column_options(o)) unless o.primary_key?
            #### Begin monkeypatch to get a string id PRIMARY KEY working in sqlite
            if o.primary_key? && o.type == :string
              column_sql << " PRIMARY KEY"
            end
            #### End monkeypatch
            column_sql
          end
      end
    end
  end
end
