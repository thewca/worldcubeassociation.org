# frozen_string_literal: true

class GenerateChore < ApplicationJob
  def perform
    # Randomly select a member who has been there for at least a month
    members = Team.wst.current_members.select { |m| m.start_date < 1.month.ago }
    ChoreMailer.notify_wst_of_assignee(members.sample.user).deliver_now
  end
end
