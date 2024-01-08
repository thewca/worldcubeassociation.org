# frozen_string_literal: true

FactoryBot.define do
  factory :registrations_request, class: Hash do
    registrations {
      [{
        'user_id' => '15094',
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
      }]
    }

    initialize_with { attributes.stringify_keys }
  end
end
