# frozen_string_literal: true

class GenerateChore < WcaCronjob
  def perform
    # Randomly select a member who has been there for at least a month
    roles = UserGroup.teams_committees_group_wst.active_roles.select { |m| m.start_date < 1.month.ago }
    ChoreMailer.notify_wst_of_assignee(roles.sample.user).deliver_now
  end
end
