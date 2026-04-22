import { createBrowserRouter } from 'react-router';
import RootLayout from './layouts/RootLayout';
import Home from './screens/Home';
import BeatDrop from './screens/BeatDrop';
import MinusOne from './screens/MinusOne';
import Progress from './screens/Progress';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'beat-drop', Component: BeatDrop },
      { path: 'minus-one', Component: MinusOne },
      { path: 'progress', Component: Progress },
    ],
  },
]);
