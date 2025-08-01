import React, { useState } from 'react';
import { Button } from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import lockupPrimary from './LogoImages/1 Positive Primary/WCA Logo Lockup.svg';
import lockupNegative from './LogoImages/2 Negative Primary/WCA Logo Lockup.svg';
import lockupMonoBlack from './LogoImages/3 Mono Black/WCA Logo Lockup.svg';
import lockupMonoWhite from './LogoImages/4 Mono White/WCA Logo Lockup.svg';
import logoOnlyPrimary from './LogoImages/1 Positive Primary/WCA Logo.svg';
import logoOnlyNegative from './LogoImages/2 Negative Primary/WCA Logo.svg';
import logoOnlyMonoBlack from './LogoImages/3 Mono Black/WCA Logo.svg';
import logoOnlyMonoWhite from './LogoImages/4 Mono White/WCA Logo.svg';

const logoBox = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: '#ffffff',
  padding: '25px',
  borderRadius: '5px',
};

const logoBoxDark = {
  ...logoBox,
  backgroundColor: '#1c2a33',
};

const logoOnlyBox = {
  ...logoBox,
  maxWidth: '150px',
};

const logoOnlyBoxDark = {
  ...logoBox,
  backgroundColor: '#1c2a33',
  maxWidth: '150px',
};

const sideBySideStyle = {
  display: 'flex',
  gap: '20px',
};

/**
 * @returns {JSX.Element}
 * @constructor
 */
function Logo({ title, logoFileUrl }) {
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

  return (
    <div className="wca-logo-information">
      <h1>{title}</h1>
      <I18nHTMLTranslate i18nKey="logo.intro" />
      <h2>
        <I18nHTMLTranslate i18nKey="logo.headings.usage_guidelines.title" />
      </h2>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.paragraph.acceptable_usage"
        />
      </p>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.paragraph.see_below"
        />
      </p>
      <h3>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.title"
        />
      </h3>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.paragraph"
        />
      </p>
      <h4>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.primary.title"
        />
      </h4>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.primary.paragraph"
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={lockupPrimary} alt="Primary logo" style={logoBox} />
        <img src={lockupNegative} alt="Primary logo" style={logoBoxDark} />
      </div>
      <h4>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.mono.title"
        />
      </h4>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.color.mono.paragraph"
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={lockupMonoBlack} alt="Primary logo" style={logoBox} />
        <img src={lockupMonoWhite} alt="Primary logo" style={logoBoxDark} />
      </div>
      <h3>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.logo_only.title"
        />
      </h3>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.usage_guidelines.logo_only.paragraph"
        />
      </p>
      <div style={sideBySideStyle}>
        <img src={logoOnlyPrimary} alt="Primary logo" style={logoOnlyBox} />
        <img
          src={logoOnlyNegative}
          alt="Primary logo"
          style={logoOnlyBoxDark}
        />
        <img src={logoOnlyMonoBlack} alt="Primary logo" style={logoOnlyBox} />
        <img
          src={logoOnlyMonoWhite}
          alt="Primary logo"
          style={logoOnlyBoxDark}
        />
      </div>
      <h2>
        <I18nHTMLTranslate
          i18nKey="logo.headings.download_logo_assets.title"
        />
      </h2>
      <p>
        <I18nHTMLTranslate
          i18nKey="logo.headings.download_logo_assets.paragraph"
        />
      </p>
      <div>
        <label htmlFor="checkbox_id">
          <input
            type="checkbox"
            name="checkbox"
            id="checkbox_id"
            value={acceptedGuidelines}
            onClick={() => setAcceptedGuidelines(!acceptedGuidelines)}
            style={{ marginRight: '10px' }}
          />
          <I18nHTMLTranslate
            i18nKey="logo.headings.download_logo_assets.accept_terms_and_conditions"
          />
        </label>
      </div>
      <Button
        disabled={!acceptedGuidelines}
        positive
        as="a"
        href={logoFileUrl}
      >
        <I18nHTMLTranslate
          i18nKey="logo.headings.download_logo_assets.download_button_text"
        />
      </Button>
    </div>
  );
}

export default Logo;
