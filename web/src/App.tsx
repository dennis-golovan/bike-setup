import { createHashRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { BikeDetailPage } from './pages/BikeDetailPage';
import { BikeEditPage } from './pages/BikeEditPage';
import { BikeListPage } from './pages/BikeListPage';
import { LocationEditPage } from './pages/LocationEditPage';
import { LocationListPage } from './pages/LocationListPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupDetailPage } from './pages/SetupDetailPage';
import { SetupEditPage } from './pages/SetupEditPage';

const router = createHashRouter([
  { path: '/', element: <BikeListPage /> },
  { path: '/bike/new', element: <BikeEditPage /> },
  { path: '/bike/:bikeId', element: <BikeDetailPage /> },
  { path: '/bike/:bikeId/edit', element: <BikeEditPage /> },
  { path: '/bike/:bikeId/setup/new', element: <SetupEditPage /> },
  { path: '/setup/:setupId', element: <SetupDetailPage /> },
  { path: '/setup/:setupId/edit', element: <SetupEditPage /> },
  { path: '/locations', element: <LocationListPage /> },
  { path: '/location/new', element: <LocationEditPage /> },
  { path: '/location/:locationId', element: <LocationEditPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <BikeListPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
