import React, { useMemo } from 'react';
import SectionProvider, {
  useSectionAllowIgnoreDisabled,
  useSectionDisabled,
  useSections,
} from './provider/FormSectionProvider';

export default function SubSection({
  section,
  children,
  disabled = false,
  allowIgnoreDisabled = true,
}) {
  const sections = useSections();

  const parentDisabled = useSectionDisabled();
  const parentAllowIgnoreDisabled = useSectionAllowIgnoreDisabled();

  const currentSubSection = useMemo(
    () => sections.concat(section),
    [sections, section],
  );

  return (
    <SectionProvider
      section={currentSubSection}
      disabled={parentDisabled || disabled}
      allowIgnoreDisabled={parentAllowIgnoreDisabled && allowIgnoreDisabled}
    >
      {children}
    </SectionProvider>
  );
}
