require "rails_helper"

RSpec.describe CompetitionsMailer, type: :mailer do
  describe "notify_board_of_confirmed_competition" do
    before :each do
      @delegate = FactoryGirl.create :delegate
      @competition = FactoryGirl.create :competition, delegates: [@delegate]
      @mail = CompetitionsMailer.notify_board_of_confirmed_competition(@delegate, @competition)
    end

    it "renders" do
      expect(@mail.subject).to eq("#{@delegate.name} just confirmed #{@competition.name}")
      expect(@mail.to).to eq(["board@worldcubeassociation.org"])
      expect(@mail.from).to eq(["notifications@worldcubeassociation.org"])
      expect(@mail.reply_to).to eq([@delegate.email])
      expect(@mail.body.encoded).to match("#{@competition.name} is confirmed")
      expect(@mail.body.encoded).to match(admin_edit_competition_url(@competition))
    end
  end
end
