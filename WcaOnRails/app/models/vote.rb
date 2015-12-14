class Vote < ActiveRecord::Base

  belongs_to :user
  belongs_to :poll

  has_many :vote_options

  accepts_nested_attributes_for :vote_options, reject_if: :all_blank, allow_destroy: true

end
