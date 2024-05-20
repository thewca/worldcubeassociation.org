# frozen_string_literal: true

after :user_groups do
  # Board Roles
  past_board_roles = 9.times.collect { |index| FactoryBot.create!(:board_role, :inactive) }
  current_board_roles = 4.times.collect { |index| FactoryBot.create!(:board_role, :active) }

  # Officer Roles
  # Giving officer roles to all board users except past_board_roles[0] and current_board_roles[0]
  FactoryBot.create!(:executive_director_role, :inactive, user: past_board_roles[1].user)
  FactoryBot.create!(:executive_director_role, :inactive, user: past_board_roles[2].user)
  FactoryBot.create!(:executive_director_role, user: current_board_roles[1].user)
  FactoryBot.create!(:chair_role, :inactive, user: past_board_roles[2].user)
  FactoryBot.create!(:chair_role, :inactive, user: past_board_roles[3].user)
  FactoryBot.create!(:chair_role, user: current_board_roles[1].user)
  FactoryBot.create!(:vice_chair_role, :inactive, user: past_board_roles[4].user)
  FactoryBot.create!(:vice_chair_role, :inactive, user: past_board_roles[5].user)
  FactoryBot.create!(:vice_chair_role, user: current_board_roles[2].user)
  FactoryBot.create!(:secretary_role, :inactive, user: past_board_roles[6].user)
  FactoryBot.create!(:secretary_role, :inactive, user: past_board_roles[7].user)
  FactoryBot.create!(:secretary_role, user: current_board_roles[3].user)
  FactoryBot.create!(:secretary_role)
  FactoryBot.create!(:treasurer_role, :inactive, user: past_board_roles[8].user)
  FactoryBot.create!(:treasurer_role, :inactive)
  FactoryBot.create!(:treasurer_role)
end
