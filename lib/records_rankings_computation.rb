# frozen_string_literal: true

module RecordsRankingsComputation
  def self.compute_everything
    self.unfold_result_attempts
    self.store_raw_records
  end

  def self.unfold_result_attempts
    DbHelper.with_temp_table('auxiliary_result_attempts') do |temp_table_name|
      subqueries = (1..5).map do |i|
        <<-SQL
          SELECT id, #{i} AS idx, value#{i} AS value
          FROM Results
          WHERE value#{i} > 0
        SQL
      end

      subquery = "(" + subqueries.join(") UNION ALL (") + ")"

      ActiveRecord::Base.connection.execute <<-SQL
        INSERT INTO #{temp_table_name} (result_id, idx, value)
        #{subquery}
      SQL
    end
  end

  def self.store_raw_records
    DbHelper.with_temp_table('auxiliary_raw_records') do |temp_table_name|
      ActiveRecord::Base.connection.execute <<-SQL
        INSERT INTO #{temp_table_name} (result_id, type, value, record_name)
        (SELECT Results.id AS result_id, 'single' AS type, best AS value, regionalSingleRecord AS record_name FROM Results WHERE regionalSingleRecord<>'')
        UNION ALL
        (SELECT Results.id AS result_id, 'average' AS type, average AS value, regionalAverageRecord AS record_name FROM Results WHERE regionalAverageRecord<>'')
      SQL
    end
  end
end
