import React from 'react';
import {
  Dropdown,
  Grid, Header, Menu, Segment,
} from 'semantic-ui-react';
import {
  panelWfcPageDataUrl,
  countryBandsUrl,
} from '../../../lib/requests/routes.js.erb';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import DelegateProbations from '../../DelegateProbations';
import DuesExport from './DuesExport';

const sections = [
  {
    id: 'dues-export',
    name: 'Dues Export',
    Component: DuesExport,
  },
  {
    id: 'country-bands',
    name: 'Country Bands',
  },
  {
    id: 'delegate-probations',
    name: 'Delegate Probations',
    Component: DelegateProbations,
    forAtleastSeniorMember: true,
  },
];

export default function Wfc() {
  const { data, loading, error } = useLoadedData(panelWfcPageDataUrl);
  const [selectedMenu, setSelectedMenu] = React.useState(sections[0].id);
  const SelectedComponent = React.useMemo(() => sections.find(
    (section) => section.id === selectedMenu,
  ).Component, [selectedMenu]);

  if (loading) return <Loading />;
  if (error) return <Errored />;

  function menuClickHandler(value) {
    if (value === 'country-bands') {
      window.open(countryBandsUrl, '_blank');
      return;
    }
    setSelectedMenu(value);
  }

  return (
    <div className="container">
      <Header as="h1">WFC Panel</Header>
      <Grid container>
        <Grid.Column only="computer" computer={4}>
          <Menu vertical>
            {sections.map((section) => (
              (!(section.forAtleastSeniorMember) || data.isAtleastSeniorMember) && (
              <Menu.Item
                key={section.id}
                name={section.name}
                active={selectedMenu === section.id}
                onClick={() => menuClickHandler(section.id)}
              >
                {section.name}
              </Menu.Item>
              )
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container centered>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={sections.filter((section) => (
                    !(section.forAtleastSeniorMember) || data.isAtleastSeniorMember
                  )).map((section) => ({
                    key: section.id,
                    text: section.name,
                    value: section.id,
                  }))}
                  value={selectedMenu}
                  onChange={(_, { value }) => menuClickHandler(value)}
                />
              </Grid.Row>
              <Grid.Row><SelectedComponent /></Grid.Row>
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </div>
  );
}
