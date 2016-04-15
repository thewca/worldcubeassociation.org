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

  describe "clock_format" do
    it "prefixes with 0 for times less than 1 second" do
      expect(solve_time(94).clock_format).to eq "0.94"
    end

    it "does not prefix with 0 for times between 1 and 10 seconds" do
      expect(solve_time(500).clock_format).to eq "5.00"
    end
  end

  describe "ordering" do
    it "orders regular solves" do
      expect(solve_time(100) < solve_time(1000)).to eq true
    end

    it "treats skipped as worst" do
      expect(SolveTime::SKIPPED < SolveTime::DNF).to eq true
      expect(SolveTime::SKIPPED < SolveTime::DNS).to eq true
      expect(SolveTime::SKIPPED < solve_time(30)).to eq true
    end

    it "treats DNS as worse than DNF" do
      expect(SolveTime::DNS < SolveTime::DNF).to eq true
      expect(SolveTime::DNS < solve_time(30)).to eq true
    end

    it "treats DNS as worse than a finished solve" do
      expect(SolveTime::DNF > solve_time(30)).to eq true
    end
  end
end
