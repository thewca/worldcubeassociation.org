import { useContext } from 'react';
import StepContext from '../lib/StepContext';

export default function useSteps() {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return context;
}
