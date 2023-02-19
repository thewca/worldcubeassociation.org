# frozen_string_literal: true

class ReadonlyRecord < ActiveRecord::Base
  self.abstract_class = true
  # This Class is for Models that should always read from the read replica
  # If you want to use the read replica for a single query use ActiveRecord::Base.connected_to(role: :read_replica)
  connects_to database: { writing: :primary, reading: :primary_replica }
end
