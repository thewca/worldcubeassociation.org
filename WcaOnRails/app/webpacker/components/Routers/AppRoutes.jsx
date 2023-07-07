import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Disclaimer from '../StaticPages/Disclaimer';
import NotFound404 from '../NotFound404';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="disclaimer" element={<Disclaimer />} />
        <Route path="*" element={<NotFound404 />} />
      </Routes>
    </BrowserRouter>
  );
}
