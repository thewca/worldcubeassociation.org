# frozen_string_literal: true

class CreateTraineeDelegateApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :trainee_delegate_applications do |t|
      t.references :applicant, null: false, foreign_key: { to_table: :users }
      t.references :delegate_region, null: false, foreign_key: { to_table: :user_groups }
      t.text :introduction, null: false
      t.text :competition_contributions, null: false
      t.text :volunteer_history
      t.text :motivation, null: false
      t.text :relevant_skills, null: false
      # No default on purpose: applicants have to answer the question, a default would record an unanswered "No".
      t.boolean :is_involved_in_cubing_business, null: false # rubocop:disable Rails/ThreeStateBooleanColumn
      t.text :cubing_business_involvement_details
      t.timestamps
    end

    # The join tables reference `application_id` rather than `trainee_delegate_application_id`,
    #   because the index names generated for the latter exceed MySQL's 64 character limit.
    create_table :trainee_delegate_conversations do |t|
      t.references :application, null: false, index: false, foreign_key: { to_table: :trainee_delegate_applications }
      t.references :user, null: false, foreign_key: true
      t.timestamps

      t.index %i[application_id user_id], unique: true, name: "index_trainee_delegate_conversations_uniqueness"
    end

    create_table :trainee_delegate_recommendations do |t|
      t.references :application, null: false, index: false, foreign_key: { to_table: :trainee_delegate_applications }
      t.references :user, null: false, foreign_key: true
      t.timestamps

      t.index %i[application_id user_id], unique: true, name: "index_trainee_delegate_recommendations_uniqueness"
    end
  end
end
