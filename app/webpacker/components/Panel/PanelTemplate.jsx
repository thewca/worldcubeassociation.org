import React from 'react';
import {
  Container,
  Dropdown,
  Grid, Header, Icon, Menu, Segment,
} from 'semantic-ui-react';
import useHash from '../../lib/hooks/useHash';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';
import PanelPages from './PanelPages';

export default function PanelTemplate({
  heading, sections = [], pages, loggedInUserId,
}) {
  const [hash, setHash] = useHash();

  const SelectedComponent = React.useMemo(() => {
    let selectedSection;
    if (pages) {
      const selectedMenuIndex = pages.findIndex((page) => page === hash);
      if (selectedMenuIndex === -1) {
        setHash(pages[0]);
        return () => null;
      }
      selectedSection = PanelPages[hash];
    } else {
      const selectedMenuIndex = sections.findIndex((section) => section.id === hash);
      if (selectedMenuIndex === -1) {
        setHash(sections[0].id);
        return () => null;
      }
      selectedSection = sections[selectedMenuIndex];
    }
    if (selectedSection.component) {
      return selectedSection.component;
    }
    window.open(selectedSection.link);
    return () => null;
  }, [sections, pages, hash, setHash]);

  const menuOptions = React.useMemo(() => (pages ? pages.map(
    (page) => ({
      id: page,
      ...PanelPages[page],
    }),
  ) : sections), [pages, sections]);

  return (
    <Container fluid>
      <Header as="h1">{heading}</Header>
      <Grid>
        <Grid.Column only="computer" computer={4}>
          <Menu vertical fluid>
            {menuOptions.map((menuOption) => (
              <Menu.Item
                key={menuOption.id}
                name={menuOption.name}
                active={menuOption.id === hash}
                onClick={() => setHash(menuOption.id)}
              >
                {!menuOption.component && <Icon name="external alternate" />}
                {menuOption.name}
              </Menu.Item>
            ))}
          </Menu>
        </Grid.Column>

        <Grid.Column stretched computer={12} mobile={16} tablet={16}>
          <Segment>
            <Grid container padded>
              <Grid.Row only="tablet mobile">
                <Dropdown
                  inline
                  options={menuOptions.map((menuOption) => ({
                    key: menuOption.id,
                    text: menuOption.name,
                    value: menuOption.id,
                    icon: !menuOption.component && 'external alternate',
                  }))}
                  value={hash}
                  onChange={(_, { value }) => setHash(value)}
                />
              </Grid.Row>
              {/* TODO: Fix the Grid.Row by removing CSS style and using appropriate props from
                        semantic-ui */}
              <Grid.Row style={{ margin: 0 }}>
                <div style={{ width: '100%' }}>
                  <ConfirmProvider>
                    <SelectedComponent loggedInUserId={loggedInUserId} />
                  </ConfirmProvider>
                </div>
              </Grid.Row>
            </Grid>
          </Segment>
        </Grid.Column>
      </Grid>
    </Container>
  );
}
