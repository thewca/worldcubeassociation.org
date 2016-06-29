class PreferredFormat < ActiveRecord::Base
  belongs_to :event
  belongs_to :format
end
