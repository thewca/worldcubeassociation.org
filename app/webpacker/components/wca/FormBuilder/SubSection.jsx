import React, { useMemo } from 'react';
import SectionProvider, {
  useSectionAllowDisabledOverride,
  useSectionDisabled,
  useSections,
} from './provider/FormSectionProvider';

export default function SubSection({
  section,
  children,
  disabled = false,
  allowDisabledOverride = true,
}) {
  const sections = useSections();

  const parentDisabled = useSectionDisabled();
  const parentAllowDisabledOverride = useSectionAllowDisabledOverride();

  const currentSubSection = useMemo(
    () => sections.concat(section),
    [sections, section],
  );

  return (
    <SectionProvider
      section={currentSubSection}
      disabled={parentDisabled || disabled}
      allowDisabledOverride={parentAllowDisabledOverride && allowDisabledOverride}
    >
      {children}
    </SectionProvider>
  );
}
