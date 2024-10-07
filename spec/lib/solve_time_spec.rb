# frozen_string_literal: true

require 'solve_time'

def solve_time(centis)
  SolveTime.new('333', :single, centis)
end

RSpec.describe "SolveTime" do
  it "DNF" do
    expect(solve_time(-1).clock_format).to eq "DNF"
    expect(solve_time(-1).clock_format_with_units).to eq "DNF"
  end

  it "DNS" do
    expect(solve_time(-2).clock_format).to eq "DNS"
    expect(solve_time(-2).clock_format_with_units).to eq "DNS"
  end

  it "skipped?" do
    expect(solve_time(0).skipped?).to eq true
    expect(solve_time(0).clock_format).to eq ""
    expect(solve_time(0).clock_format_with_units).to eq ""
  end

  context "333mbf" do
    it "set number attempted" do
      solve_time = SolveTime.new("333mbf", :single, 0)
      solve_time.attempted = 3
      solve_time.solved = 2
      solve_time.time_centiseconds = (3.minutes + 58.seconds).in_centiseconds

      expect(solve_time.clock_format).to eq "2/3 3:58"
    end
  end

  describe "ordering" do
    it "orders regular solves" do
      expect(solve_time(100) < solve_time(1000)).to eq true
    end

    it "treats skipped as worst" do
      expect(solve_time(SolveTime::SKIPPED_VALUE) > solve_time(SolveTime::DNF_VALUE)).to eq true
      expect(solve_time(SolveTime::SKIPPED_VALUE) > solve_time(SolveTime::DNS_VALUE)).to eq true
      expect(solve_time(SolveTime::SKIPPED_VALUE) > solve_time(30)).to eq true
    end

    it "treats DNS as worse than DNF" do
      expect(solve_time(SolveTime::DNS_VALUE) > solve_time(SolveTime::DNF_VALUE)).to eq true
      expect(solve_time(SolveTime::DNS_VALUE) > solve_time(30)).to eq true
    end

    it "treats DNS as worse than a finished solve" do
      expect(solve_time(SolveTime::DNF_VALUE) > solve_time(30)).to eq true
    end
  end

  describe "clock_format" do
    it "prefixes with 0 for times less than 1 second" do
      expect(solve_time(94).clock_format).to eq "0.94"
      expect(solve_time(94).clock_format_with_units).to eq "0.94 seconds"
    end

    it "does not prefix with 0 for times between 1 and 10 seconds" do
      expect(solve_time(500).clock_format).to eq "5.00"
      expect(solve_time(500).clock_format_with_units).to eq "5.00 seconds"
    end

    it "formats just seconds" do
      expect(solve_time(4242).clock_format).to eq "42.42"
      expect(solve_time(4242).clock_format_with_units).to eq "42.42 seconds"
    end

    it "formats minutes" do
      expect(solve_time((3 * 60 * 100) + 4242).clock_format).to eq "3:42.42"
      expect(solve_time((3 * 60 * 100) + 4242).clock_format_with_units).to eq "3:42.42"
    end

    it "formats hours" do
      expect(solve_time((2 * 60 * 100 * 60) + (3 * 60 * 100) + 4242).clock_format).to eq "2:03:42.42"
      expect(solve_time((2 * 60 * 100 * 60) + (3 * 60 * 100) + 4242).clock_format_with_units).to eq "2:03:42.42"
    end

    describe "333fm" do
      it "formats best" do
        solve_time = SolveTime.new('333fm', :single, 32)
        expect(solve_time.clock_format).to eq "32"
        expect(solve_time.clock_format_with_units).to eq "32 moves"
      end

      it "formats average" do
        solve_time = SolveTime.new('333fm', :average, 3267)
        expect(solve_time.clock_format).to eq "32.67"
        expect(solve_time.clock_format_with_units).to eq "32.67 moves"

        solve_time = SolveTime.new('333fm', :average, 2500)
        expect(solve_time.clock_format).to eq "25.00"
        expect(solve_time.clock_format_with_units).to eq "25.00 moves"
      end
    end

    describe "333mbf" do
      it "formats best" do
        solve_time = SolveTime.new('333mbf', :single, 580_325_400)
        expect(solve_time.clock_format).to eq "41/41 54:14"
        expect(solve_time.clock_format_with_units).to eq "41/41 54:14"
      end

      it "formats with time less than 60 seconds" do
        solve_time = SolveTime.new('333mbf', :single, 970_005_900)
        expect(solve_time.clock_format).to eq "2/2 0:59"
        expect(solve_time.clock_format_with_units).to eq "2/2 0:59"
      end

      it "gives correct cutoff value" do
        cutoff = SolveTime.points_to_multibld_attempt(4)
        solve4pts = SolveTime.new("333mbf", :single, 950_024_000)
        solve5pts = SolveTime.new("333mbf", :single, 940_360_200)
        expect(solve4pts.wca_value).to be > cutoff
        expect(solve5pts.wca_value).to be < cutoff
      end
    end

    describe "333mbo" do
      it "formats best" do
        solve_time = SolveTime.new('333mbo', :single, 1_960_706_900)
        expect(solve_time.clock_format).to eq "3/7 1:55:00"
        expect(solve_time.clock_format_with_units).to eq "3/7 1:55:00"
      end

      it "handles missing times" do
        solve_time = SolveTime.new('333mbo', :single, 969_999_900)
        expect(solve_time.clock_format).to eq "3/3 ?:??:??"
        expect(solve_time.clock_format_with_units).to eq "3/3 ?:??:??"
      end
    end
  end
end
