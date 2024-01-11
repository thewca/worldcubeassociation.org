# frozen_string_literal: true

FactoryBot.define do
  factory :registrations_request, class: Hash do
    transient do
      user_ids { [] }
      transient_registrations do
        user_ids.map do |id|
          {
            'user_id' => id.to_s,
            'competing' =>
              {
                'event_ids' => ['333', '444'],
                'registration_status' => 'pending',
                'registered_on' => '2023-12-21T10:46:30.794+00:00',
                'comment' => 'test',
                'admin_comment' => 'test2',
                'waiting_list_position' => 0,
              },
            'payment' => { 'payment_status' => 'null', 'updated_at' => 'null' },
            'guests' => 2,
          }
        end
      end
      non_competing_registration {
        [{
          'user_id' => user_ids[-1].to_s,
          'payment' => { 'payment_status' => 'null', 'updated_at' => 'null' },
        }]
      }
      registrations_with_non_competing { transient_registrations[0...-1] + non_competing_registration }
    end

    registrations { transient_registrations }

    trait :includes_non_competing do
      # last_registration = transient_registrations.pop..except('competing')
      registrations { registrations_with_non_competing } # + last_registration }
    end

        # [
          # *registrations,
          # {
          #   'attendee_id' => 'non_competing_id',
          #   'payment' => { 'payment_status' => 'null', 'updated_at' => 'null' },
          #   'guests' => 2,
          # },
        # ]

        # Remove the 'competing' key from the last registration hash
        # puts "modifying last registration"
        # puts last_registration
        # puts last_registration

        # updated_registrations
      # transient do
      #   non_competing = user_ids.pop
      # end
      # temp_registrations = []
      # user_ids.map
      # user_ids.map do |id|
      #   temp_registrations << {
      #     'attendee_id' => id.to_s,
      #     'competing' =>
      #       {
      #         'event_ids' => ['333', '444'],
      #         'registration_status' => 'pending',
      #         'registered_on' => '2023-12-21T10:46:30.794+00:00',
      #         'comment' => 'test',
      #         'admin_comment' => 'test2',
      #         'waiting_list_position' => 0,
      #       },
      #     'payment' => { 'payment_status' => 'null', 'updated_at' => 'null' },
      #     'guests' => 2,
      #   }
      # end

      # temp_registrations << {
      #   'attendee_id' => non_competing.to_s,
      #   'payment' => { 'payment_status' => 'null', 'updated_at' => 'null' },
      # }

      # registrations { temp_registrations }
    # end

    initialize_with { attributes.stringify_keys }
  end
end
