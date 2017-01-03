# frozen_string_literal: true
require 'solve_time'

def solve_time(centis)
  SolveTime.new('333', :single, centis)
end

describe "SolveTime" do
  it "DNF" do
    expect(solve_time(-1).clock_format).to eq "DNF"
  end

  it "DNS" do
    expect(solve_time(-2).clock_format).to eq "DNS"
  end

  it "skipped?" do
    expect(solve_time(0).skipped?).to eq true
  end

  context "333mbf" do
    it "set number attempted" do
      solve_time = SolveTime.new("333mbf", :single, 0)
      solve_time.attempted = 3
      solve_time.solved = 2
      solve_time.time_centiseconds = 3 * 60 * 100 + 5800

      expect(solve_time.clock_format).to eq "2/3 3:58"
    end
  end

  describe "ordering" do
    it "orders regular solves" do
      expect(solve_time(100) < solve_time(1000)).to eq true
    end

    it "treats skipped as worst" do
      expect(SolveTime::SKIPPED > SolveTime::DNF).to eq true
      expect(SolveTime::SKIPPED > SolveTime::DNS).to eq true
      expect(SolveTime::SKIPPED > solve_time(30)).to eq true
    end

    it "treats DNS as worse than DNF" do
      expect(SolveTime::DNS > SolveTime::DNF).to eq true
      expect(SolveTime::DNS > solve_time(30)).to eq true
    end

    it "treats DNS as worse than a finished solve" do
      expect(SolveTime::DNF > solve_time(30)).to eq true
    end
  end

  describe "clock_format" do
    it "prefixes with 0 for times less than 1 second" do
      expect(solve_time(94).clock_format).to eq "0.94"
    end

    it "does not prefix with 0 for times between 1 and 10 seconds" do
      expect(solve_time(500).clock_format).to eq "5.00"
    end

    it "formats just seconds" do
      expect(solve_time(4242).clock_format).to eq "42.42"
    end

    it "formats minutes" do
      expect(solve_time(3 * 60 * 100 + 4242).clock_format).to eq "3:42.42"
    end

    it "formats hours" do
      expect(solve_time(2 * 60 * 100 * 60 + 3 * 60 * 100 + 4242).clock_format).to eq "2:03:42.42"
    end

    describe "333fm" do
      it "formats best" do
        solve_time = SolveTime.new('333fm', :single, 32)
        expect(solve_time.clock_format).to eq "32"
      end

      it "formats average" do
        solve_time = SolveTime.new('333fm', :average, 3267)
        expect(solve_time.clock_format).to eq "32.67"

        solve_time = SolveTime.new('333fm', :average, 2500)
        expect(solve_time.clock_format).to eq "25.00"
      end
    end

    describe "333mbf" do
      it "formats best" do
        solve_time = SolveTime.new('333mbf', :single, 580325400)
        expect(solve_time.clock_format).to eq "41/41 54:14"
      end

      it "formats with time less than 60 seconds" do
        solve_time = SolveTime.new('333mbf', :single, 970005900)
        expect(solve_time.clock_format).to eq "2/2 0:59"
      end
    end

    describe "333mbo" do
      it "formats best" do
        solve_time = SolveTime.new('333mbo', :single, 1960706900)
        expect(solve_time.clock_format).to eq "3/7 1:55:00"
      end

      it "handles missing times" do
        solve_time = SolveTime.new('333mbo', :single, 969999900)
        expect(solve_time.clock_format).to eq "3/3 ?:??:??"
      end
    end
  end
end
