class Vote < ActiveRecord::Base

  belongs_to :user
  belongs_to :poll

  has_and_belongs_to_many :poll_options, through: :vote_options

  accepts_nested_attributes_for :poll_options, reject_if: :all_blank, allow_destroy: true

end
