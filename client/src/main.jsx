import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getToken } from './api/client';
import { store } from './app/store';
import { fetchMe } from './features/auth/authSlice';
import './styles/base.css';
import './styles/app.css';

if (getToken()) store.dispatch(fetchMe());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
