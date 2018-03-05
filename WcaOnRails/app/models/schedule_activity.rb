class ScheduleActivity < ApplicationRecord
  belongs_to :holder, polymorphic: true
  has_many :children_activities, class_name: "ScheduleActivity", as: :holder
end
