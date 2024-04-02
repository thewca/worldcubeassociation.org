# frozen_string_literal: true

after :user_groups, :roles_metadata_officers do
  executive_director_metadatas = RolesMetadataOfficers.where(status: :executive_director)
  chair_metadatas = RolesMetadataOfficers.where(status: :chair)
  vice_chair_metadatas = RolesMetadataOfficers.where(status: :vice_chair)
  secretary_metadatas = RolesMetadataOfficers.where(status: :secretary)
  treasurer_metadatas = RolesMetadataOfficers.where(status: :treasurer)
  board_group = UserGroup.find_by!(group_type: :board)
  officer_group = UserGroup.find_by!(group_type: :officers)

  # Past board roles
  past_board_roles = 9.times.collect do |index|
    UserRole.create!(
      user: index < 7 ? FactoryBot.create(:user_with_wca_id) : FactoryBot.create(:user), # Creates 2 board users without wca_id
      group: board_group,
      start_date: Faker::Date.between(from: 10.years.ago, to: 5.years.ago),
      end_date: Faker::Date.between(from: 5.years.ago, to: Date.today),
    )
  end

  # Current board roles
  current_board_roles = 4.times.collect do |index|
    UserRole.create!(
      user: index < 3 ? FactoryBot.create(:user_with_wca_id) : FactoryBot.create(:user), # Creates 1 board user without wca_id
      group: board_group,
      start_date: Faker::Date.between(from: 10.years.ago, to: 5.years.ago),
    )
  end

  # Past officer roles (Giving officer roles to all past board users except past_board_roles[0])
  UserRole.create!(
    user_id: past_board_roles[1].user_id,
    group: officer_group,
    start_date: past_board_roles[1].start_date,
    end_date: past_board_roles[1].end_date,
    metadata: executive_director_metadatas[0],
  )

  UserRole.create!(
    user_id: past_board_roles[2].user_id,
    group: officer_group,
    start_date: past_board_roles[2].start_date,
    end_date: past_board_roles[2].end_date,
    metadata: executive_director_metadatas[1],
  )

  UserRole.create!(
    user_id: past_board_roles[2].user_id,
    group: officer_group,
    start_date: past_board_roles[2].start_date,
    end_date: past_board_roles[2].end_date,
    metadata: chair_metadatas[0],
  )

  UserRole.create!(
    user_id: past_board_roles[3].user_id,
    group: officer_group,
    start_date: past_board_roles[3].start_date,
    end_date: past_board_roles[3].end_date,
    metadata: chair_metadatas[1],
  )

  UserRole.create!(
    user_id: past_board_roles[4].user_id,
    group: officer_group,
    start_date: past_board_roles[4].start_date,
    end_date: past_board_roles[4].end_date,
    metadata: vice_chair_metadatas[0],
  )

  UserRole.create!(
    user_id: past_board_roles[5].user_id,
    group: officer_group,
    start_date: past_board_roles[5].start_date,
    end_date: past_board_roles[5].end_date,
    metadata: vice_chair_metadatas[1],
  )

  UserRole.create!(
    user_id: past_board_roles[6].user_id,
    group: officer_group,
    start_date: past_board_roles[6].start_date,
    end_date: past_board_roles[6].end_date,
    metadata: secretary_metadatas[0],
  )

  UserRole.create!(
    user_id: past_board_roles[7].user_id,
    group: officer_group,
    start_date: past_board_roles[7].start_date,
    end_date: past_board_roles[7].end_date,
    metadata: secretary_metadatas[1],
  )

  UserRole.create!(
    user_id: past_board_roles[8].user_id,
    group: officer_group,
    start_date: past_board_roles[8].start_date,
    end_date: past_board_roles[8].end_date,
    metadata: treasurer_metadatas[0],
  )

  UserRole.create!(
    user: FactoryBot.create(:user),
    group: officer_group,
    start_date: Faker::Date.between(from: 10.years.ago, to: 5.years.ago),
    end_date: Faker::Date.between(from: 5.years.ago, to: Date.today),
    metadata: treasurer_metadatas[1],
  )

  # Current officer roles (Giving officer roles to all current board users except current_board_roles[0])
  UserRole.create!(
    user_id: current_board_roles[1].user_id,
    group: officer_group,
    start_date: current_board_roles[1].start_date,
    metadata: executive_director_metadatas[2],
  )

  UserRole.create!(
    user_id: current_board_roles[1].user_id,
    group: officer_group,
    start_date: current_board_roles[1].start_date,
    metadata: chair_metadatas[2],
  )

  UserRole.create!(
    user_id: current_board_roles[2].user_id,
    group: officer_group,
    start_date: current_board_roles[2].start_date,
    metadata: vice_chair_metadatas[2],
  )

  UserRole.create!(
    user_id: current_board_roles[3].user_id,
    group: officer_group,
    start_date: current_board_roles[3].start_date,
    metadata: secretary_metadatas[2],
  )

  UserRole.create!(
    user: FactoryBot.create(:user),
    group: officer_group,
    start_date: Faker::Date.between(from: 5.years.ago, to: Date.today),
    metadata: secretary_metadatas[3],
  )

  UserRole.create!(
    user: FactoryBot.create(:user),
    group: officer_group,
    start_date: Faker::Date.between(from: 5.years.ago, to: Date.today),
    metadata: treasurer_metadatas[2],
  )
end
