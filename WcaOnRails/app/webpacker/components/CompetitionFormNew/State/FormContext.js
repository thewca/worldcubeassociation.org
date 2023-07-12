import React from 'react';

const FormContext = React.createContext({ formData: {}, setFormData: (data) => data });

export default FormContext;
