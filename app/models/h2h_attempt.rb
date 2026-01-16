class H2hAttempt < ApplicationRecord
  belongs_to :h2h_competitor # TODO: We can probably remove this, I just need to find a different way of assigning set_attempt_number
  belongs_to :h2h_set
  belongs_to :live_attempt, optional: true
  belongs_to :result_attempt, optional: true
end
