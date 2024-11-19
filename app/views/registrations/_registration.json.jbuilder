json.cache! ['registration-user', registration, @pii] do
  json.user do
    if @pii
      json.extract! registration.user, :id, :wca_id, :name, :gender, :country_iso2, :email, :dob
    else
      json.extract! registration.user, :id, :wca_id, :name, :gender, :country_iso2
    end
    json.country registration.user.country
  end
end

json.user_id registration.user_id

json.cache! ['registration-competing', registration, @admin] do
  json.competing do
    json.event_ids registration.event_ids
    if @admin
      json.registration_status registration.competing_status
      json.registered_on registration.created_at
      json.comment registration.comments
      json.admin_comment registration.administrative_notes

      if registration.competing_status == "waiting_list"
        json.waiting_list_position registration.waiting_list_position
      end
    end
  end
end

if @admin
  json.cache! ['registration-payment', registration.registration_payments] do
    if @payment
      json.payment do
        json.has_paid registration.outstanding_entry_fees <= 0
        json.payment_statuses registration.registration_payments.sort_by(&:created_at).reverse.map(&:payment_status)
        json.payment_amount_iso registration.paid_entry_fees.cents
        json.payment_amount_human_readable "#{registration.paid_entry_fees.format} (#{registration.paid_entry_fees.currency.name})"
        json.updated_at registration.last_payment_date
      end
    end
  end
  json.guests registration.guests
end

if @history
  json.history registration.registration_history || []
end
