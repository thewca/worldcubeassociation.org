class MicropostTest < ActiveSupport::TestCase
  def setup
    @contact = Contact.new(
      name: "Jeremy",
      message: "Hi",
      your_email: "jeremy@example.com",
      to_email: "to@example.com",
      subject: "Subject"
    )
  end

  test "should be valid" do
    assert @contact.valid?
  end

  test "your_email must be present" do
    @contact.your_email = ""
    assert_not @contact.valid?
  end

  test "your_email must be valid" do
    @contact.your_email = "foo"
    assert_not @contact.valid?
  end

  test "to_email must be present" do
    @contact.to_email = ""
    assert_not @contact.valid?
  end

  test "to_email must be valid" do
    @contact.to_email = "foo"
    assert_not @contact.valid?
  end
end
