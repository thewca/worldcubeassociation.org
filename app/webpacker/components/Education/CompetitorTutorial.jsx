import React from "react";
import I18n from "../../lib/i18n";
import I18nHTMLTranslate from "../I18nHTMLTranslate";
import "./styles.css";

const blockStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
  padding: "3rem 4rem",
};
const flexboxRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "5rem",
};
const flexboxColumn = {
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};
const smallBorderedImage = {
  flexShrink: 0,
  width: "170px",
  marginInline: "8rem",
  border: "8px solid var(--white-color)",
  borderRadius: "8px",
};

const CompetitorTutorial = () => {
  return (
    <section>
      <div style={{ ...blockStyle, backgroundColor: "var(--white-color)" }}>
        <h1>{I18n.t("competitor_tutorial.title")}</h1>
        <p>{I18n.t("competitor_tutorial.intro")}</p>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--green-color)",
          color: "white",
        }}
      >
        <h2>{I18n.t("competitor_tutorial.before_the_comp.title")}</h2>
        <div style={{ ...flexboxRow, gap: "3rem" }}>
          <p>
            {I18n.t("competitor_tutorial.before_the_comp.check_your_email")}
          </p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/email.png?raw=true"
            style={{ flexShrink: 0, width: "150px" }}
          />
          <p>{I18n.t("competitor_tutorial.before_the_comp.check_comp_site")}</p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut07.png?raw=true"
            style={{ flexShrink: 0, width: "150px" }}
          />
        </div>
        <p>
          {I18n.t("competitor_tutorial.before_the_comp.remember_delegates")}
        </p>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--blue-color)",
          color: "white",
        }}
      >
        <h2>{I18n.t("competitor_tutorial.arriving.title")}</h2>
        <div style={flexboxRow}>
          <div style={flexboxColumn}>
            <p>{I18n.t("competitor_tutorial.arriving.check_in")}</p>
            <p>
              {I18n.t("competitor_tutorial.arriving.new_competitor_tutorial")}
            </p>
            <p>{I18n.t("competitor_tutorial.arriving.announcements")}</p>
          </div>
          <div style={{ flexShrink: 0, width: "400px", overflow: "hidden" }}>
            <img
              src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut08.png?raw=true"
              style={{ width: "100%", marginBlock: "-5rem" }}
            />
          </div>
        </div>
        <div style={flexboxRow}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/judging.jpg?raw=true"
            style={{ flexShrink: 0, width: "450px" }}
          />
          <p>{I18n.t("competitor_tutorial.arriving.volunteers")}</p>
        </div>
        <div style={flexboxRow}>
          <p>{I18n.t("competitor_tutorial.arriving.live_results")}</p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/qrcode.png?raw=true"
            style={{ flexShrink: 0, width: "200px", marginInline: "6rem" }}
          />
        </div>
        <p style={{ textAlign: "center", fontSize: "1.6rem" }}>
          {I18n.t("competitor_tutorial.arriving.have_fun")}
        </p>
      </div>

      <div style={{ ...blockStyle, backgroundColor: "var(--yellow-color)" }}>
        <h2>{I18n.t("competitor_tutorial.competing.title")}</h2>
        <div style={flexboxRow}>
          <div style={flexboxColumn}>
            <p>{I18n.t("competitor_tutorial.competing.groups")}</p>
            <p>
              {I18n.t("competitor_tutorial.competing.delegate_may_call_group")}
            </p>
            <p>{I18n.t("competitor_tutorial.competing.submitting_puzzle")}</p>
          </div>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/puzzle_into_cover.jpg?raw=true"
            style={{ flexShrink: 0, width: "500px" }}
          />
        </div>
        <div style={flexboxRow}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/images/scoresheet.png?raw=true"
            style={{ flexShrink: 0, width: "550px" }}
          />
          <div style={flexboxColumn}>
            <p>
              {I18n.t("competitor_tutorial.competing.puzzles_must_be_legal")}
            </p>
            <ul>
              <li>
                {I18n.t("competitor_tutorial.competing.puzzle_legality_1")}
              </li>
              <li>
                {I18n.t("competitor_tutorial.competing.puzzle_legality_2")}
              </li>
              <li>
                {I18n.t("competitor_tutorial.competing.puzzle_legality_3")}
              </li>
              <li>
                {I18n.t("competitor_tutorial.competing.puzzle_legality_4")}
              </li>
              <li>
                {I18n.t("competitor_tutorial.competing.puzzle_legality_5")}
              </li>
            </ul>
            <p>
              {I18n.t("competitor_tutorial.competing.ask_delegate")}
            </p>
            <p>{I18n.t("competitor_tutorial.competing.typical_scorecard")}</p>
          </div>
        </div>
        <div style={{ ...flexboxColumn, alignItems: "center" }}>
          <p style={{ fontSize: "1.6rem" }}>
            {I18n.t("competitor_tutorial.competing.dont_discuss_scrambles")}
          </p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/discussing_scrambles.jpg?raw=true"
            style={{ width: "650px" }}
          />
        </div>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--orange-color)",
          color: "white",
        }}
      >
        <div style={flexboxRow}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut10.png?raw=true"
            style={{ flexShrink: 0, width: "400px" }}
          />
          <div style={flexboxColumn}>
            <p>{I18n.t("competitor_tutorial.competing.cameras")}</p>
            <p>{I18n.t("competitor_tutorial.competing.inspection")}</p>
          </div>
        </div>
        <div style={flexboxRow}>
          <p>{I18n.t("competitor_tutorial.competing.timer")}</p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut03.png?raw=true"
            style={smallBorderedImage}
          />
        </div>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--red-color)",
          color: "white",
        }}
      >
        <p>
          <I18nHTMLTranslate i18nKey="competitor_tutorial.competing.penalties.plus2s" />
        </p>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut04.png?raw=true"
            style={smallBorderedImage}
          />
          <p style={{ fontSize: "1.6rem" }}>
            &bull; {I18n.t("competitor_tutorial.competing.penalties.plus2_1")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut05.png?raw=true"
            style={smallBorderedImage}
          />
          <p style={{ fontSize: "1.6rem" }}>
            &bull; {I18n.t("competitor_tutorial.competing.penalties.plus2_2")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/?raw=true"
            style={smallBorderedImage}
          />
          <p style={{ fontSize: "1.6rem" }}>
            &bull; {I18n.t("competitor_tutorial.competing.penalties.plus2_3")}
          </p>
        </div>
        <p>
          <I18nHTMLTranslate i18nKey="competitor_tutorial.competing.penalties.dnfs" />
        </p>
        <div style={flexboxRow}>
          <ul>
            <li style={{ marginBottom: "1rem" }}>
              {I18n.t("competitor_tutorial.competing.penalties.dnf_1")}
            </li>
            <li style={{ marginBottom: "1rem" }}>
              {I18n.t("competitor_tutorial.competing.penalties.dnf_2")}
            </li>
            <li>
              {I18n.t("competitor_tutorial.competing.penalties.dnf_3")}
            </li>
          </ul>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/tut09.png?raw=true"
            style={smallBorderedImage}
          />
        </div>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--green-color)",
          color: "white",
        }}
      >
        <p>{I18n.t("competitor_tutorial.competing.cutoffs_and_time_limits")}</p>
        <ul>
          <li style={{ marginBottom: "1rem" }}>
            {I18n.t("competitor_tutorial.competing.cutoff")}
          </li>
          <li>{I18n.t("competitor_tutorial.competing.time_limit")}</li>
        </ul>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/?raw=true"
            style={smallBorderedImage}
          />
          <div style={flexboxColumn}>
            <p>
              {I18n.t("competitor_tutorial.competing.fixing_twists_and_flips")}
            </p>
            <p>{I18n.t("competitor_tutorial.competing.call_delegate")}</p>
          </div>
        </div>
        <div style={{ ...flexboxColumn, alignItems: "center" }}>
          <p style={{ fontSize: "1.6rem" }}>
            {I18n.t("competitor_tutorial.competing.dont_react")}
          </p>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/overreaction.jpg?raw=true"
            style={{ width: "650px" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={flexboxColumn}>
            <p>
              {I18n.t("competitor_tutorial.competing.sign_scorecard")}
            </p>
            <p>{I18n.t("competitor_tutorial.competing.once_finished")}</p>
          </div>
          <img
            src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/?raw=true"
            style={smallBorderedImage}
          />
        </div>
      </div>

      <div
        style={{
          ...blockStyle,
          backgroundColor: "var(--blue-color)",
          color: "white",
        }}
      >
        <h2>{I18n.t("competitor_tutorial.after_the_comp.title")}</h2>
        <div style={{ ...flexboxRow, textAlign: "center" }}>
          <p>{I18n.t("competitor_tutorial.after_the_comp.results")}</p>
          <p>
            <I18nHTMLTranslate i18nKey="competitor_tutorial.after_the_comp.wca_id" />
          </p>
          <p>
            {I18n.t("competitor_tutorial.after_the_comp.reach_out_to_friends")}
          </p>
        </div>
        <img
          src="https://github.com/thewca/wca-documents/blob/master/edudoc/competitor-tutorial/new-tutorial-images/competitor_results.jpg?raw=true"
          style={{ width: "900px", marginInline: "auto" }}
        />
      </div>

      <div style={{ ...blockStyle, backgroundColor: "var(--white-color)" }}>
        <h2>{I18n.t("competitor_tutorial.additional_info.title")}</h2>
        <p>
          <I18nHTMLTranslate i18nKey="competitor_tutorial.additional_info.more_info" />
        </p>
        <p>
          <I18nHTMLTranslate i18nKey="competitor_tutorial.additional_info.regulations" />
        </p>
        <p>
          <I18nHTMLTranslate i18nKey="competitor_tutorial.additional_info.local_delegate" />
        </p>
        <h2>{I18n.t("competitor_tutorial.additional_info.credits_title")}</h2>
        <p>{I18n.t("competitor_tutorial.additional_info.credits")}</p>
      </div>
    </section>
  );
};

export default CompetitorTutorial;
