// scan-AppProviders.js
import validateComponent from './lib/debug/validateComponent.js';
import AppProvidersRaw from './components/providers/AppProviders.js';

const AppProviders = validateComponent(AppProvidersRaw, 'AppProviders');
