class DelegateReport < ActiveRecord::Base
  belongs_to :competition, required: true
end
