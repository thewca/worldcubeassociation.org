# frozen_string_literal: true

class ContactGearOrder < ContactForm
  attribute :form_values
  attribute :order_details

  def to_email
    ["finance@worldcubeassociation.org", your_email]
  end

  def subject
    Time.now.strftime("WCA Gear Order Form - #{name} on %d %b %Y at %R")
  end

  def headers
    super.merge(template_name: "contact_gear_order")
  end
end
