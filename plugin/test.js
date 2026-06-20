import plugin from './index.js';

console.log('Testing plugin...');
const mockedApi = {
  getState: () => ({ currentTask: 'test-task' }),
  onShutdown: (cb) => {
    console.log('Registered shutdown callback. Shutting down in 2 seconds...');
    setTimeout(cb, 2000);
  }
};

plugin.registerFull(mockedApi);
