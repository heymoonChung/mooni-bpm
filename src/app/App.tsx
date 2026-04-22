import { RouterProvider } from 'react-router';
import { router } from './routes';
import { TrackProvider } from './context/TrackContext';

export default function App() {
  return (
    <TrackProvider>
      <RouterProvider router={router} />
    </TrackProvider>
  );
}
