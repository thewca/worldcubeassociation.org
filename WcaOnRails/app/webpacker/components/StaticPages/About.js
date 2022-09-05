import React from 'react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

const DONATE_PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=W5JL8J4S8UTJU';
const DONATE_GUIDESTAR_URL = 'https://www.nfggive.com/guidestar/82-3825954';

/**
 * @param {{ name: string, country_name: string, id: number, [k]: * }[]} currentBoardMembers
 * @returns {JSX.Element}
 * @constructor
 */
function About({ currentBoardMembers }) {
  return (
    <>
      <div className="jumbotron">
        <p className="lead">
          {I18n.t('about.donation_banner.content')}
        </p>
        <hr className="my-4" />

        <a className="btn btn-primary btn-lg" href={DONATE_GUIDESTAR_URL} role="button">
          {I18n.t('about.donation_banner.donate_credit')}
        </a>
        <a className="btn btn-primary btn-lg" href={DONATE_PAYPAL_URL} role="button">
          {I18n.t('about.donation_banner.donate_paypal')}
        </a>
        <a className="btn btn-primary btn-lg" href="#contribute" role="button">
          {I18n.t('about.donation_banner.donate_other')}
        </a>
      </div>

      <blockquote className="blockquote">
        <p className="mb-0">
          {I18n.t('about.mission_statement')}
        </p>
        <footer className="blockquote-footer">
          {I18n.t('about.mission_footer')}
        </footer>
      </blockquote>

      <h2>
        {I18n.t('about.who_we_are_title')}
      </h2>
      <div className="row">
        <div className="col-md-8">
          <I18nHTMLTranslate i18nKey="about.who_we_are_content_html" />
        </div>
        <div className="col-md-4">
          <img className="about-page-image" src="/assets/about/bulgarian-open.jpg" alt="" />
        </div>
      </div>

      <blockquote className="blockquote">
        <p className="mb-0">
          {I18n.t('about.spirit')}
        </p>
        <footer className="blockquote-footer">
          {I18n.t('about.spirit_footer')}
        </footer>
      </blockquote>

      <h2>
        {I18n.t('about.our_goals_title')}
      </h2>

      <I18nHTMLTranslate i18nKey="about.our_goals_content_html" />

      <h2>{I18n.t('about.whats_next_title')}</h2>
      <I18nHTMLTranslate i18nKey="about.whats_next_content_html" />

      <h2>{I18n.t('about.world_championship_title')}</h2>
      <div className="row">
        <div className="col-md-8">
          <I18nHTMLTranslate i18nKey="about.world_championship_content_html" />
        </div>
        <div className="col-md-4">
          <img className="about-page-image" src="/assets/about/worlds-2015.jpg" alt="" />
        </div>
      </div>

      <h2>
        {I18n.t('about.structure.title')}
      </h2>

      <p>
        {I18n.t('about.structure.board.description')}
      </p>

      <ul>
        {currentBoardMembers.map((member) => (
          <li key={member.id}>
            {member.name}
            {' '}
            -
            {' '}
            {member.country_name}
          </li>
        ))}
      </ul>

      <p>
        <I18nHTMLTranslate
          i18nKey="about.structure.operations_html"
          options={{
            committees_and_teams: `
                <a href="/teams-committees">
                    ${I18n.t('about.structure.teams_committees')}
                </a>
            `,
          }}
        />
      </p>

      <p>
        <I18nHTMLTranslate
          i18nKey="about.structure.delegates_html"
          options={{
            see_link: I18n.t('about.structure.see_link_html'),
          }}
        />
      </p>

      <p>
        {I18n.t('about.structure.members_html')}
      </p>

      <h2 id="contribute">
        {I18n.t('about.contributing_title')}
      </h2>
      <p>
        <I18nHTMLTranslate
          i18nKey="about.contributing_content_html"
          options={{
            here_credit: `<a href="${DONATE_GUIDESTAR_URL}">${I18n.t('common.here')}</a>`,
            here_paypal: `<a href="${DONATE_PAYPAL_URL}">${I18n.t('common.here')}</a>`,
          }}
        />
        <em>
          <br />
          <br />
          World Cube Association
          <br />
          5042 Wilshire Blvd #43206
          <br />
          Los Angeles, CA 90036
          <br />
          United States of America
          <br />
          <br />
        </em>
        {I18n.t('about.tax_deductible_note')}
      </p>

      <h2>
        {I18n.t('about.other_help_title')}
      </h2>
      <I18nHTMLTranslate i18nKey="about.other_help_content_html" />
    </>
  );
}

export default About;
