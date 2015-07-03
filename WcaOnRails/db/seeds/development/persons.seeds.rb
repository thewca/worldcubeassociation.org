50.times do |i|
  Person.create(
    id: "2005FLEI%02d" % i,
    subId: 1,
    name: "Jeremy Fleischman ##{i}",
    countryId: "USA",
    gender: "m",
  )
end
