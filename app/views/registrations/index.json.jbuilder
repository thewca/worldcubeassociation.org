json.array! @registrations do |registration|
  json.partial! "registrations/registration", registration: registration
end
