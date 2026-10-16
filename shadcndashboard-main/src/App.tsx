import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { RestaurantProvider } from './context/restaurant-context/RestaurantContext';
import { Toaster } from './components/ui/sonner';
import './css/globals.css';

function App() {
  return (
    <RestaurantProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </RestaurantProvider>
  );
}

export default App;
