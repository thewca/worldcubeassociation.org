class H2hAttempt < ApplicationRecord
  belongs_to :h2h_competitor
  belongs_to :h2h_set
  belongs_to :live_attempt
end
