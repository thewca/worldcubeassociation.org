import React, { useMemo } from 'react';
import SectionProvider, { useSections } from '../store/sections';

export default function SubSection({ section, children }) {
  const sections = useSections();

  const currentSubSection = useMemo(
    () => sections.concat(section),
    [sections, section],
  );

  return (
    <SectionProvider
      section={currentSubSection}
    >
      {children}
    </SectionProvider>
  );
}
