import React, { useMemo } from 'react';
import SectionProvider, { useSectionDisabled, useSections } from './provider/FormSectionProvider';

export default function SubSection({ section, children }) {
  const sections = useSections();
  const parentDisabled = useSectionDisabled();

  const currentSubSection = useMemo(
    () => sections.concat(section),
    [sections, section],
  );

  return (
    <SectionProvider
      section={currentSubSection}
      disabled={parentDisabled}
    >
      {children}
    </SectionProvider>
  );
}
