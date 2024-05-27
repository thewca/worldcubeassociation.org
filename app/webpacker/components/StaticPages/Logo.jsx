import React, { useState } from "react";
import I18nHTMLTranslate from "../I18nHTMLTranslate";
import lockupPrimary from "./LogoImages/WCA Lockup Positive Primary.png";
import lockupNegative from "./LogoImages/WCA Lockup Negative Primary.png";
import lockupMonoBlack from "./LogoImages/WCA Lockup Mono Black.png";
import lockupMonoWhite from "./LogoImages/WCA Lockup Mono White.png";
import logoOnlyPrimary from "./LogoImages/WCA Logo Only Positive Primary.png";
import logoOnlyNegative from "./LogoImages/WCA Logo Only Negative Primary.png";
import logoOnlyMonoBlack from "./LogoImages/WCA Logo Only Mono Black.png";
import logoOnlyMonoWhite from "./LogoImages/WCA Logo Only Mono White.png";

const lockupStyle = {
  width: "100%",
  maxWidth: "400px",
  backgroundColor: "#f8f8f8",
};

const lockupStyleDark = {
  ...lockupStyle,
  backgroundColor: "#1c2a33",
};

const logoOnlyStyle = {
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "150px",
  padding: "25px",
  backgroundColor: "#f8f8f8",
};

const logoOnlyStyleDark = {
  ...logoOnlyStyle,
  backgroundColor: "#1c2a33",
};

const sideBySideStyle = {
  display: "flex",
  gap: "20px",
};

/**
 * @returns {JSX.Element}
 * @constructor
 */
function Logo({ title }) {
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

  const downloadFile = () => {
    window.location.href = "/files/WCA Logo Assets.zip";
  };

  return (
    <div className="wca-logo-information">
      <h1>{title}</h1>
      <I18nHTMLTranslate i18nKey={`logo.intro`} />
      <h2>
        <I18nHTMLTranslate i18nKey={`logo.headings.usage_guidelines.title`} />
      </h2>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.paragraph.acceptable_usage`}
        />
      </p>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.paragraph.see_below`}
        />
      </p>
      <h3>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.title`}
        />
      </h3>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.paragraph`}
        />
      </p>
      <h4>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.primary.title`}
        />
      </h4>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.primary.paragraph`}
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={lockupPrimary} alt="Primary logo" style={lockupStyle} />
        <img src={lockupNegative} alt="Primary logo" style={lockupStyleDark} />
      </div>
      <h4>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.mono.title`}
        />
      </h4>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.color.mono.paragraph`}
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={lockupMonoBlack} alt="Primary logo" style={lockupStyle} />
        <img src={lockupMonoWhite} alt="Primary logo" style={lockupStyleDark} />
      </div>
      <h3>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.logo_only.title`}
        />
      </h3>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.usage_guidelines.logo_only.paragraph`}
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={logoOnlyPrimary} alt="Primary logo" style={logoOnlyStyle} />
        <img
          src={logoOnlyNegative}
          alt="Primary logo"
          style={logoOnlyStyleDark}
        />
        <img src={logoOnlyMonoBlack} alt="Primary logo" style={logoOnlyStyle} />
        <img
          src={logoOnlyMonoWhite}
          alt="Primary logo"
          style={logoOnlyStyleDark}
        />
      </div>
      <h2>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.download_logo_assets.title`}
        />
      </h2>
      <p>
        <I18nHTMLTranslate
          i18nKey={`logo.headings.download_logo_assets.paragraph`}
        />
      </p>
      <div>
        <label>
          <input
            type="checkbox"
            name="checkbox"
            id="checkbox_id"
            value={acceptedGuidelines}
            onClick={() => setAcceptedGuidelines(!acceptedGuidelines)}
            style={{ marginRight: "10px" }}
          />
          <I18nHTMLTranslate
            i18nKey={`logo.headings.download_logo_assets.accept_terms_and_conditions`}
          />
        </label>
      </div>
      <button
        disabled={!acceptedGuidelines}
        onClick={downloadFile}
        className="btn btn-success"
      >
        <I18nHTMLTranslate
          i18nKey={`logo.headings.download_logo_assets.download_button_text`}
        />
      </button>
    </div>
  );
}

export default Logo;
