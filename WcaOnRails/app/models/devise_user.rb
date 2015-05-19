class DeviseUser < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable

  def results_team_member?
    return false # TODO
  end
end
