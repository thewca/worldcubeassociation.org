class Api::Internal::V1::PermissionsController < Api::Internal::V1::ApiController
  def index
    user_id = params.require(:user_id)
    user = User.find(user_id)
    render json: {
      can_attend_competitions: {
        scope: user.cannot_register_for_competition_reasons.empty? ? "*" : [],
        until: user.banned? ? user.current_team_members.select(:team == Team.banned).first.end_date : nil
      },
      can_organize_competitions: {
        scope: user.can_create_competitions? ? "*" : [],
      },
      can_administer_competitions: {
        scope: user.can_admin_competitions? ? "*" : (user.delegated_competitions + user.organized_competitions).pluck("id"),
      },
    }
  end
end
